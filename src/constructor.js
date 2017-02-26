/*
	example:

	new DataCache({
		capacity: 100,
		keyType: "number"
	});
*/

function DataCache(options) {
	let cache = this._debugCache = [];

	/* public functions */

	this.get = (() => {
		let onlyPropertyNames = [ "data", "metadata" ],
			onlyOptionNames = new A(onlyPropertyNames.length);

		for (let i = 0, l = onlyOptionNames.length; i < l; ++i)
			onlyOptionNames[i] = onlyPropertyNames[i] + "Only";

		return function(key, options) {
			let value = null;

			if (typeof key !== privateKeyType)
				return value;

			let index = search(cache, key);

			if (index === -1)
				return value;

			value = cache[index];

			if (getCurrentTimestamp() - value.metadata.updated > privateMaxAge) {
				this.unset(key);
				return null;
			}

			if (options) {
				for (let i = 0, setOnlyOptionCount = 0, l = onlyOptionNames.length; i < l; ++i) {
					if (options[onlyOptionNames[i]]) {
						if (setOnlyOptionCount++)
							throw errorMaker(
								"Options",
								onlyOptionNames,
								ERROR_MAKER_OPT_ONE_MAX | ERROR_MAKER_OPT_NEGATED
									| ERROR_MAKER_OPT_ALTERNATIVES | ERROR_MAKER_OPT_CONTAIN
							);

						value = value[onlyPropertyNames[i]];
					}
				}
			}

			return value;
		};
	})();

	this.has = function(key) {
		return (typeof key === privateKeyType && search(cache, key) > -1);
	};

	this.set = function(key, data) {
		if (typeof privateKeyType !== STRING_TYPE)
			setDefinedProperty("keyType", (typeof key));

		if (typeof key !== privateKeyType)
			throw errorMaker("Key", "a " + privateKeyType, NO_OPT, TypeError);

		if (data == null)
			throw errorMaker("Data", [UNDEFINED_TYPE, NULL_NAME],
				ERROR_MAKER_OPT_ALTERNATIVES | ERROR_MAKER_OPT_NEGATED,
				TypeError);

		let index = search(cache, key);

		if (index === -1)
			index = cache.length + 1;

		// when capacity is reached, start writing over oldest data
		// use double value to account for consecutive key-value pairs
		if (index >= privateCapacity * 2)
			index = getDefinedProperty("_oldestIndex");

		let object = {
				data: data
			},
			metadata = object.metadata = {
				updated: getCurrentTimestamp()
			},
			cachedMetadata = (cache[index] && cache[index].metadata && typeof cache[index].metadata.created === NUMBER_TYPE)
				? cache[index].metadata
				: metadata;

		metadata.created = cachedMetadata.created || cachedMetadata.updated;

		// use ECMAScript 5 freeze function to make objects immutable,
		// therefore stored data and metadata can only be changed by
		// re-setting it
		if (EXISTS.freeze)
			deepFreeze(object);

		cache[index - 1] = key;
		cache[index] = object;

		sort(cache);
		return object;
	};

	this.unset = function(key) {
		let value = null;

		if (typeof key !== privateKeyType)
			return value;

		let index = search(cache, key),
			length = cache.length;

		if (index === -1)
			return value;

		if (length > 2) {
			// swap current indices with final two indices in order to pop
			for (let i = 1, tmp; i >= 0; --i) {
				tmp = cache[index - i];
				cache[index - i] = cache[length - i - 1];
				cache[length - i - 1] = tmp;
			}
		}

		value = cache.pop();
		cache.pop();

		sort(cache);
		return value;
	};

	this.iterate = function(callback, options) {
		for (let i = 0, l = cache.length, key, value; i < l; i += 2) {
			key = cache[i];
			value = this.get(key, options);

			if (value !== null)
				callback(key, value);
		}
	};

	this.map = function(callback, options) {
		let returnsFullObject = (!options || !options.dataOnly);

		for (let i = 0, l = cache.length, key, value, newValue; i < l; i += 2) {
			key = cache[i];
			value = this.get(key, options);

			if (value !== null) {
				newValue = callback(key, value);

				this.set(key, ((returnsFullObject) ? newValue.data : newValue));
			}
		}
	};

	this.filter = function(callback, options) {
		for (let i = 0, l = cache.length, key, value, swap1, swap2, tmp; i < l; /* empty */) {
			key = cache[i];
			value = this.get(key, options);

			if (value !== null && !callback(key, this.get(key, options))) {
				// move filtered indices to the end of array to be subsequently popped
				for (let j = 0; j < 2; ++j) {
					swap1 = i + j;
					swap2 = l - 2 + j;

					tmp = cache[swap1];
					cache[swap1] = cache[swap2];
					cache[swap2] = tmp;
				}

				// pop the moved indices, by shrinking the length
				l = (cache.length -= 2);

				// move swapped indices back to the end of the array, therefore sorted
				for (let j = i, m = l - 2; j < m; j += 2) {
					for (let k = 0; k < 2; ++k) {
						swap1 = j + k;
						swap2 = swap1 + 2;

						tmp = cache[swap1];
						cache[swap1] = cache[swap2];
						cache[swap2] = tmp;
					}
				}

				// skip the increment below in order to revist the same index,
				// which now contains new data
				continue;
			}

			i += 2;
		}
	};

	this.clear = () => {
		cache = [];
	};

	/* initialize getters and setters, including fallback for environments without native support */

	let getFallbackDefinedPropertyName = (prefix, prop) => {
			let i = 0,
				u = (prop.charAt(i) === "_")
					? (++i, "_")
					: "";
			u += prefix + prop.charAt(i).toUpperCase();
			return u + prop.slice(i + 1);
		},
		definePropertyHere = (prop, options) => {
			if (EXISTS.defineProperty) {
				O.defineProperty(this, prop, options);
			} else {
				let keys = [ "g", "s" ];

				for (let i = 0, l = keys.length, k; i < l; ++i) {
					k = keys[i] + "et";
					if (typeof options[k] === FUNCTION_TYPE)
						this[getFallbackDefinedPropertyName(k, prop)] = options[k];
				}
			}
		},
		getDefinedProperty = (prop) => {
			return (EXISTS.defineProperty)
				? this[prop]
				: this[getFallbackDefinedPropertyName("get", prop)]();
		},
		setDefinedProperty = (prop, value) => {
			return (EXISTS.defineProperty)
				? (this[prop] = value)
				: this[getFallbackDefinedPropertyName("set", prop)](value);
		};

	/* public getters and setters */

	let privateKeyType = null;

	definePropertyHere("keyType", {
		get: (() => privateKeyType),
		set: (() => {
			let error = errorMaker(
					"keyType",
					ALLOWABLE_KEY_TYPES,
					ERROR_MAKER_OPT_ALTERNATIVES | ERROR_MAKER_OPT_PROPERTY,
					TypeError
				);

			return (keyType) => {
				if (keyType === privateKeyType)
					return;

				if (ALLOWABLE_KEY_TYPES.includes(keyType))
					privateKeyType = keyType;
				else
					throw error;
			};
		})()
	});

	if (options && typeof options.keyType !== UNDEFINED_TYPE)
		setDefinedProperty("keyType", options.keyType);


	definePropertyHere("size", {
		get: (() => cache.length / 2),
		set: (size) => {
			if (size >= getDefinedProperty("size"))
				return;

			let capacityStr = "capacity",
				setCapacity = (capacity) => { setDefinedProperty(capacityStr, capacity); },
				oldCapacity = getDefinedProperty(capacityStr)

			setCapacity(size);
			setCapacity(oldCapacity);
		}
	});


	let privateCapacity = 0;

	definePropertyHere("capacity", {
		get: (() => privateCapacity),
		set: (() => {
			// curry function
			let capacityErrorMaker = (predicative, bitmaskOptions, constructor) => {
					return errorMaker(
						"capacity",
						predicative,
						ERROR_MAKER_OPT_PROPERTY | bitmaskOptions,
						constructor
					);
				};

			return (capacity) => {
				if (capacity === privateCapacity) {
					return; // do nothing
				} else if (typeof capacity !== NUMBER_TYPE || isNaN(capacity)) {
					throw capacityErrorMaker("a number (excluding NaN)", NO_OPT, TypeError);
				} else if (capacity < 0) {
					throw capacityErrorMaker("negative", ERROR_MAKER_OPT_NEGATED, RangeError);
				} else if (capacity < privateCapacity) {
					let difference = M.min(privateCapacity, this.size) - capacity;

					for (let i = 0; i < difference; ++i) {
						let index = getDefinedProperty("_oldestIndex");
						this.unset(cache[index - 1]);
					}
				}

				privateCapacity = M.min(M.round(capacity), MAX_CAPACITY);
			};
		})()
	});

	setDefinedProperty(
		"capacity",
		(options && typeof options.capacity !== UNDEFINED_TYPE)
			? options.capacity
			: MAX_CAPACITY
	);


	let privateMaxAge = global.Infinity;

	definePropertyHere("maxAge", {
		get: (() => privateMaxAge),
		set: (() => {
			let maxAgeErrorMaker = (predicative, bitmaskOptions, constructor) => {
					return errorMaker(
						"maxAge",
						predicative,
						ERROR_MAKER_OPT_PROPERTY | bitmaskOptions,
						constructor
					);
				};

			return(maxAge) => {
				if (maxAge === privateMaxAge) {
					return;
				} else if (typeof maxAge !== NUMBER_TYPE || isNaN(maxAge)) {
					throw maxAgeErrorMaker("a number of milliseconds", NO_OPT, TypeError);
				} else if (maxAge < 0) {
					throw maxAgeErrorMaker("negative", ERROR_MAKER_OPT_NEGATED, RangeError);
				}

				privateMaxAge = maxAge;
			};
		})()
    });

	if (options && typeof options.maxAge !== UNDEFINED_TYPE)
		setDefinedProperty("maxAge", options.maxAge);


	/* private getters and setters */

	definePropertyHere("_oldestIndex", {
		get: () => {
			let index = 1,
				updated = N.MAX_VALUE || global.Infinity;

			for (let i = index, l = cache.length; i < l; i += 2) {
				if (cache[i].metadata.updated < updated) {
					updated = cache[i].metadata.updated;
					index = i;
				}
			}

			return index;
		}
	});
}


{
	// the following method, on both the constructor and its prototype, can be used
	// to determine whether to use new-style getters and setters if it returns true
	//     (e.g. this.capacity = 100)
	// or old-style getters and settters if false
	//     (e.g. this.setCapacity(100))
	let supportsNativeGettersAndSetters = ((methodName) => {
			let objects = [ DataCache, DataCache.prototype ],
				method = (() => EXISTS.defineProperty);

			for (let i = 0, l = objects.length; i < l; ++i)
				objects[i][methodName] = method;

			return method();
		})("supportsNativeGettersAndSetters");

	let prototype = {

			getData: ((options) => {
				return function(key) {
					return this.get(key, options);
				}
			})({ dataOnly: true }),

			getMetadata: ((options) => {
				return function(key) {
					return this.get(key, options);
				}
			})({ metadataOnly: true }),

			isFull: function() {
				return (supportsNativeGettersAndSetters)
					? this.size === this.capacity
					: this.getSize() === this.getCapacity();
			},

			isEmpty: function() {
				return ((supportsNativeGettersAndSetters) ? this.size : this.getSize()) === 0;
			}

		};

	assignObject(DataCache.prototype, prototype);
}


{
	let constructorName = "DataCache";

	if (typeof module === OBJECT_TYPE && typeof module.exports === OBJECT_TYPE) {
		// CommonJS / Node.js
		module.exports = DataCache;
	} else if (typeof define === FUNCTION_TYPE && define.amd) {
		// AMD
		define([ constructorName ], [], DataCache);
	} else {
		// all other environments
		global[constructorName] = DataCache;
	}
}

