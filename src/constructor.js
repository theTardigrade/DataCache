/*
	example:

	new DataCache({
		capacity: 100,
		keyType: "number"
	});
*/

function DataCache(options) {
	let privateCache = [];

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

			let index = helper_search(privateCache, key);

			if (index === -1)
				return value;

			value = privateCache[index];

			if (helper_getCurrentTimestamp() - value.metadata.updated > privateMaxAge) {
				this.unset(key);
				return null;
			}

			if (options) {
				for (let i = 0, setOnlyOptionCount = 0, l = onlyOptionNames.length; i < l; ++i) {
					if (options[onlyOptionNames[i]]) {
						if (setOnlyOptionCount++)
							throw helper_errorMaker(
								"Options",
								onlyOptionNames,
								HELPER_ERROR_MAKER_OPTION_MORE_THAN | HELPER_ERROR_MAKER_OPTION_NEGATED
									| HELPER_ERROR_MAKER_OPTION_ALTERNATIVES | HELPER_ERROR_MAKER_OPTION_CONTAIN
							);

						value = value[onlyPropertyNames[i]];
					}
				}
			}

			return value;
		};
	})();

	this.has = function(key) {
		return (typeof key === privateKeyType && helper_search(privateCache, key) > -1);
	};

	this.set = function(key, data) {
		if (typeof privateKeyType !== STRING_TYPE)
			setDefinedProperty("keyType", (typeof key));

		if (typeof key !== privateKeyType)
			throw helper_errorMaker(
				"Key",
				privateKeyType,
				HELPER_ERROR_MAKER_OPTION_INDEFINITE_ARTICLE,
				TypeError
			);

		if (data == null)
			throw helper_errorMaker(
				"Data",
				[UNDEFINED_TYPE, NULL_NAME],
				HELPER_ERROR_MAKER_OPTION_ALTERNATIVES | HELPER_ERROR_MAKER_OPTION_NEGATED,
				TypeError
			);

		let index = helper_search(privateCache, key);

		if (index === -1)
			index = privateCache.length + 1;

		// when capacity is reached, start writing over oldest data
		// use double value to account for consecutive key-value pairs
		if (index >= privateCapacity * 2)
			index = getDefinedProperty("_oldestIndex");

		let object = {
				data: data
			},
			metadata = object.metadata = {
				updated: helper_getCurrentTimestamp()
			};

		metadata.created = (privateCache[index] && privateCache[index].metadata && typeof privateCache[index].metadata.created === NUMBER_TYPE)
			? privateCache[index].metadata.created
			: metadata.updated;

		// use ECMAScript 5 freeze function to make objects immutable,
		// therefore stored data and metadata can only be changed by
		// re-setting it
		if (EXISTS.freeze)
			helper_deepFreeze(object);

		privateCache[index - 1] = key;
		privateCache[index] = object;

		helper_sort(privateCache);
		return object;
	};

	this.unset = function(key) {
		let value = null;

		if (typeof key !== privateKeyType)
			return value;

		let index = helper_search(privateCache, key),
			length = privateCache.length;

		if (index === -1)
			return value;

		if (length > 2) {
			// swap current indices with final two indices in order to pop
			for (let i = 1, tmp; i >= 0; --i) {
				tmp = privateCache[index - i];
				privateCache[index - i] = privateCache[length - i - 1];
				privateCache[length - i - 1] = tmp;
			}
		}

		value = privateCache.pop();
		privateCache.pop();

		helper_sort(privateCache);
		return value;
	};

	this.collectGarbage = function() {
		if (privateMaxAge === global.Infinity)
			return;

		let garbage = [];

		for (let i = 0, l = privateCache.length, value; i < l; i += 2) {
			value = privateCache[i + 1];

			if (helper_getCurrentTimestamp() - value.metadata.updated > privateMaxAge)
				garbage.push(i);
		}

		for (let i = 0, l = garbage.length; i < l; ++i)
			this.unset(privateCache[garbage[i]]);
	};

	this.iterate = function(callback, options) {
		for (let i = 0, l = privateCache.length, key, value; i < l; i += 2) {
			key = privateCache[i];
			value = this.get(key, options);

			if (value != null)
				callback(key, value);
		}
	};

	this.map = function(callback, options) {
		let returnsFullObject = (!options || !options.dataOnly);

		for (let i = 0, l = privateCache.length, key, value, newValue; i < l; i += 2) {
			key = privateCache[i];
			value = this.get(key, options);

			if (value != null) {
				newValue = callback(key, value);

				this.set(key, ((returnsFullObject) ? newValue.data : newValue));
			}
		}
	};

	this.filter = function(callback, options) {
		for (let i = 0, l = privateCache.length, key, value, swap1, swap2, tmp; i < l; /* empty */) {
			key = privateCache[i];
			value = this.get(key, options);

			if (value != null && !callback(key, this.get(key, options))) {
				// move filtered indices to the end of array to be subsequently popped
				for (let j = 0; j < 2; ++j) {
					swap1 = i + j;
					swap2 = l - 2 + j;

					tmp = privateCache[swap1];
					privateCache[swap1] = privateCache[swap2];
					privateCache[swap2] = tmp;
				}

				// pop the moved indices, by shrinking the length
				l = (privateCache.length -= 2);

				// move swapped indices back to the end of the array, therefore sorted
				for (let j = i, m = l - 2; j < m; j += 2) {
					for (let k = 0; k < 2; ++k) {
						swap1 = j + k;
						swap2 = swap1 + 2;

						tmp = privateCache[swap1];
						privateCache[swap1] = privateCache[swap2];
						privateCache[swap2] = tmp;
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
		privateCache = [];
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

	{
		let propertyName = "keyType";

		definePropertyHere(propertyName, {
			get: (() => privateKeyType),
			set: (() => {
				let unallowableKeyTypeError = helper_getPropertyErrorMaker(propertyName)(
						ALLOWABLE_KEY_TYPES,
						HELPER_ERROR_MAKER_OPTION_ALTERNATIVES,
						TypeError
					);

				return (keyType) => {
					if (keyType === privateKeyType && keyType !== null)
						return;

					if (!ALLOWABLE_KEY_TYPES.includes(keyType))
						throw unallowableKeyTypeError;

					this.clear();
					privateKeyType = keyType;
				};
			})()
		});

		if (options && typeof options[propertyName] !== UNDEFINED_TYPE)
			setDefinedProperty(propertyName, options[propertyName]);
	}


	{
		let propertyName = "size";

		definePropertyHere(propertyName, {
			get: () => {
				this.collectGarbage();

				return privateCache.length / 2;
			},
			set: (size) => {
				if (size >= getDefinedProperty(propertyName))
					return;

				let capacityStr = "capacity",
					setCapacity = (capacity) => { setDefinedProperty(capacityStr, capacity); },
					oldCapacity = getDefinedProperty(capacityStr)

				setCapacity(size);
				setCapacity(oldCapacity);
			}
		});
	}


	let privateCapacity = 0;

	{
		let propertyName = "capacity";

		definePropertyHere(propertyName, {
			get: (() => privateCapacity),
			set: (() => {
				let capacityErrorMaker = helper_getPropertyErrorMaker(propertyName);

				return (capacity) => {
					if (capacity === privateCapacity) {
						return;
					} else if (typeof capacity !== NUMBER_TYPE || isNaN(capacity)) {
						throw capacityErrorMaker(
							NUMBER_TYPE + " (excluding NaN)",
							HELPER_ERROR_MAKER_OPTION_INDEFINITE_ARTICLE,
							TypeError
						);
					} else if (capacity < 0) {
						throw capacityErrorMaker("negative", HELPER_ERROR_MAKER_OPTION_NEGATED, RangeError);
					} else if (capacity < privateCapacity) {
						let difference = M.min(privateCapacity, getDefinedProperty("size")) - capacity;

						for (let i = 0; i < difference; ++i) {
							let index = getDefinedProperty("_oldestIndex");
							this.unset(privateCache[index - 1]);
						}
					}

					privateCapacity = M.min(M.round(capacity), MAX_CAPACITY);
				};
			})()
		});

		setDefinedProperty(
			propertyName,
			(options && typeof options[propertyName] !== UNDEFINED_TYPE)
				? options[propertyName]
				: MAX_CAPACITY
		);
	}


	let privateMaxAge = global.Infinity;

	{
		let propertyName = "maxAge";

		definePropertyHere(propertyName, {
			get: (() => privateMaxAge),
			set: (() => {
				let maxAgeErrorMaker = helper_getPropertyErrorMaker(propertyName);

				return (maxAge) => {
					if (maxAge === privateMaxAge) {
						return;
					} else if (typeof maxAge !== NUMBER_TYPE || isNaN(maxAge)) {
						throw maxAgeErrorMaker(
							NUMBER_TYPE,
							HELPER_ERROR_MAKER_OPTION_INDEFINITE_ARTICLE | HELPER_ERROR_MAKER_OPTION_UNIT_MILLISECONDS,
							TypeError
						);
					} else if (maxAge < 0) {
						throw maxAgeErrorMaker("negative", HELPER_ERROR_MAKER_OPTION_NEGATED, RangeError);
					}

					privateMaxAge = maxAge;
				};
			})()
		});

		if (options && typeof options[propertyName] !== UNDEFINED_TYPE)
			setDefinedProperty(propertyName, options[propertyName]);
	}


	let privateAutomaticGarbageCollection = false,
		privateAutomaticGarbageCollectionInterval = AUTOMATIC_GARBAGE_COLLECTION_DEFAULT_INTERVAL,
		privateAutomaticGarbageCollectionTimeoutId = 0,
		privateAutomaticGarbageCollectionTimeoutHandler = (() => {
			stopAutomaticGarbageCollection();

			if (privateAutomaticGarbageCollection) {
				this.collectGarbage();
				startAutomaticGarbageCollection();
			}
		}),
		startAutomaticGarbageCollection = () => {
			privateAutomaticGarbageCollectionTimeoutId = global.setTimeout(
				privateAutomaticGarbageCollectionTimeoutHandler,
				privateAutomaticGarbageCollectionInterval
			);
		},
		stopAutomaticGarbageCollection = () => {
			if (privateAutomaticGarbageCollectionTimeoutId)
				global.clearTimeout(privateAutomaticGarbageCollectionTimeoutId);
		};

	{
		let mainPropertyName = "automaticGarbageCollection",
			intervalPropertyName = mainPropertyName + "Interval";

		definePropertyHere(mainPropertyName, {
			get: (() => privateAutomaticGarbageCollection),
			set: (value) => {
				((privateAutomaticGarbageCollection = !!value) // intentional assignment in condition
					? startAutomaticGarbageCollection
					: stopAutomaticGarbageCollection)();
			}
		});

		if (options && typeof options[mainPropertyName] !== UNDEFINED_TYPE)
			setDefinedProperty(mainPropertyName, options[mainPropertyName]);

		definePropertyHere(intervalPropertyName, {
			get: (() => privateAutomaticGarbageCollectionInterval),
			set: (() => {
				let intervalErrorMaker = helper_getPropertyErrorMaker(intervalPropertyName);

				return (interval) => {
					if (privateAutomaticGarbageCollectionInterval === interval) {
						return;
					} else if (typeof interval !== NUMBER_TYPE || isNaN(interval)) {
						throw intervalErrorMaker(
							NUMBER_TYPE,
							HELPER_ERROR_MAKER_OPTION_INDEFINITE_ARTICLE | HELPER_ERROR_MAKER_OPTION_UNIT_MILLISECONDS,
							TypeError
						);
					} else if (interval < AUTOMATIC_GARBAGE_COLLECTION_MIN_INTERVAL) {
						throw intervalErrorMaker(
							AUTOMATIC_GARBAGE_COLLECTION_MIN_INTERVAL,
							HELPER_ERROR_MAKER_OPTION_NEGATED | HELPER_ERROR_MAKER_OPTION_LESS_THAN,
							RangeError
						);
					} else if (interval > AUTOMATIC_GARBAGE_COLLECTION_MAX_INTERVAL) {
						throw intervalErrorMaker(
							AUTOMATIC_GARBAGE_COLLECTION_MAX_INTERVAL,
							HELPER_ERROR_MAKER_OPTION_NEGATED | HELPER_ERROR_MAKER_OPTION_MORE_THAN,
							RangeError
						);
					}

					privateAutomaticGarbageCollectionInterval = interval;
				};
			})()
		});

		if (options && typeof options[intervalPropertyName] !== UNDEFINED_TYPE)
			setDefinedProperty(intervalPropertyName, options[intervalPropertyName]);
	}

	/* private getters and setters */

	definePropertyHere("_oldestIndex", {
		get: () => {
			let index = 1,
				updated = N.MAX_VALUE || global.Infinity;

			for (let i = index, l = privateCache.length; i < l; i += 2) {
				if (privateCache[i].metadata.updated < updated) {
					updated = privateCache[i].metadata.updated;
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

	helper_assignObject(DataCache.prototype, prototype);
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

