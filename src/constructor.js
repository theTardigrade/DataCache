/*
	example:

	new DataCache({
		capacity: 100,
		keyType: "number"
	});
*/

function DataCache(options) {
	let private_cache = [];

	/* public functions */

	this.get = (() => {
		let onlyPropertyNames = [ "data", "metadata" ],
			onlyOptionNames = new A(onlyPropertyNames.length);

		for (let i = 0, l = onlyOptionNames.length; i < l; ++i)
			onlyOptionNames[i] = onlyPropertyNames[i] + "Only";

		return function(key, options) {
			let value = null;

			if (typeof key !== private_keyType)
				return value;

			let index = helper_search(private_cache, key);

			if (index === -1)
				return value;

			value = private_cache[index];

			if (helper_getCurrentTimestamp() - value.metadata.updated > private_maxAge) {
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
		return (typeof key === private_keyType && helper_search(private_cache, key) > -1);
	};

	this.set = function(key, data) {
		if (typeof private_keyType !== STRING_TYPE)
			private_setDefinedProperty("keyType", (typeof key));

		if (typeof key !== private_keyType)
			throw helper_errorMaker(
				"Key",
				private_keyType,
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

		let index = helper_search(private_cache, key);

		if (index === -1)
			index = private_cache.length + 1;

		// when capacity is reached, start writing over oldest data
		// use double value to account for consecutive key-value pairs
		if (index >= private_capacity * 2)
			index = private_getOldestIndex();

		let object = {
				data: data
			},
			metadata = object.metadata = {
				updated: helper_getCurrentTimestamp()
			};

		metadata.created = (private_cache[index] && private_cache[index].metadata
			&& typeof private_cache[index].metadata.created === NUMBER_TYPE)
				? private_cache[index].metadata.created
				: metadata.updated;

		// use ECMAScript 5 freeze function to make objects immutable,
		// therefore stored data and metadata can only be changed by
		// re-setting it
		if (EXISTS.freeze)
			helper_deepFreeze(object);

		private_cache[index - 1] = key;
		private_cache[index] = object;

		helper_sort(private_cache);
		return object;
	};

	this.unset = function(key) {
		let value = null;

		if (typeof key !== private_keyType)
			return value;

		let index = helper_search(private_cache, key),
			length = private_cache.length;

		if (index === -1)
			return value;

		if (length > 2) {
			// swap current indices with final two indices in order to pop
			for (let i = 1, tmp; i >= 0; --i) {
				tmp = private_cache[index - i];
				private_cache[index - i] = private_cache[length - i - 1];
				private_cache[length - i - 1] = tmp;
			}
		}

		value = private_cache.pop();
		private_cache.pop();

		helper_sort(private_cache);
		return value;
	};

	this.collectGarbage = function() {
		if (private_maxAge === global.Infinity)
			return;

		let garbage = [],
			now = helper_getCurrentTimestamp();

		for (let i = 0, l = private_cache.length, value; i < l; i += 2) {
			value = private_cache[i + 1];

			if (now - value.metadata.updated > private_maxAge)
				garbage.push(private_cache[i]);
		}

		for (let i = 0, l = garbage.length; i < l; ++i) {
			this.unset(garbage[i]);
		}
	};

	this.iterate = function(callback, options) {
		for (let i = 0, l = private_cache.length, key, value; i < l; i += 2) {
			key = private_cache[i];
			value = this.get(key, options);

			if (value != null)
				callback(key, value);
		}
	};

	this.map = function(callback, options) {
		let returnsFullObject = (!options || !options.dataOnly);

		for (let i = 0, l = private_cache.length, key, value, newValue; i < l; i += 2) {
			key = private_cache[i];
			value = this.get(key, options);

			if (value != null) {
				newValue = callback(key, value);

				this.set(key, ((returnsFullObject) ? newValue.data : newValue));
			}
		}
	};

	this.filter = function(callback, options) {
		for (let i = 0, l = private_cache.length, key, value, swap1, swap2, tmp; i < l; /* empty */) {
			key = private_cache[i];
			value = this.get(key, options);

			if (value != null && !callback(key, this.get(key, options))) {
				// move filtered indices to the end of array to be subsequently popped
				for (let j = 0; j < 2; ++j) {
					swap1 = i + j;
					swap2 = l - 2 + j;

					tmp = private_cache[swap1];
					private_cache[swap1] = private_cache[swap2];
					private_cache[swap2] = tmp;
				}

				// pop the moved indices, by shrinking the length
				l = (private_cache.length -= 2);

				// move swapped indices back to the end of the array, therefore sorted
				for (let j = i, m = l - 2; j < m; j += 2) {
					for (let k = 0; k < 2; ++k) {
						swap1 = j + k;
						swap2 = swap1 + 2;

						tmp = private_cache[swap1];
						private_cache[swap1] = private_cache[swap2];
						private_cache[swap2] = tmp;
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
		private_cache = [];
	};

	/* initialize getters and setters, including fallback for environments without native support */

	let private_getFallbackDefinedPropertyName = (prefix, prop) => {
			let i = 0,
				u = (prop.charAt(i) === "_")
					? (++i, "_")
					: "";
			u += prefix + prop.charAt(i).toUpperCase();
			return u + prop.slice(i + 1);
		},
		private_definePropertyHere = (prop, options) => {
			if (EXISTS.defineProperty) {
				O.defineProperty(this, prop, options);
			} else {
				let keys = [ "g", "s" ];

				for (let i = 0, l = keys.length, k; i < l; ++i) {
					k = keys[i] + "et";
					if (typeof options[k] === FUNCTION_TYPE)
						this[private_getFallbackDefinedPropertyName(k, prop)] = options[k];
				}
			}
		},
		private_getDefinedProperty = (prop) => {
			return (EXISTS.defineProperty)
				? this[prop]
				: this[private_getFallbackDefinedPropertyName("get", prop)]();
		},
		private_setDefinedProperty = (prop, value) => {
			return (EXISTS.defineProperty)
				? (this[prop] = value)
				: this[private_getFallbackDefinedPropertyName("set", prop)](value);
		};

	/* public getters and setters */

	let private_keyType = null;

	{
		let propertyName = "keyType";

		private_definePropertyHere(propertyName, {
			get: (() => private_keyType),
			set: (() => {
				let unallowableKeyTypeError = helper_getPropertyErrorMaker(propertyName)(
						ALLOWABLE_KEY_TYPES,
						HELPER_ERROR_MAKER_OPTION_ALTERNATIVES,
						TypeError
					);

				return (keyType) => {
					if (keyType === private_keyType && keyType !== null)
						return;

					if (!ALLOWABLE_KEY_TYPES.includes(keyType))
						throw unallowableKeyTypeError;

					this.clear();
					private_keyType = keyType;
				};
			})()
		});

		if (options && typeof options[propertyName] !== UNDEFINED_TYPE)
			private_setDefinedProperty(propertyName, options[propertyName]);
	}


	{
		let propertyName = "size";

		private_definePropertyHere(propertyName, {
			get: () => {
				this.collectGarbage();

				return private_cache.length / 2;
			},
			set: (size) => {
				if (size >= private_getDefinedProperty(propertyName))
					return;

				let capacityStr = "capacity",
					setCapacity = (capacity) => { private_setDefinedProperty(capacityStr, capacity); },
					oldCapacity = private_getDefinedProperty(capacityStr)

				setCapacity(size);
				setCapacity(oldCapacity);
			}
		});
	}


	let private_capacity = 0;

	{
		let propertyName = "capacity";

		private_definePropertyHere(propertyName, {
			get: (() => private_capacity),
			set: (() => {
				let capacityErrorMaker = helper_getPropertyErrorMaker(propertyName);

				return (capacity) => {
					if (capacity === private_capacity) {
						return;
					} else if (typeof capacity !== NUMBER_TYPE || isNaN(capacity)) {
						throw capacityErrorMaker(
							NUMBER_TYPE + " (excluding NaN)",
							HELPER_ERROR_MAKER_OPTION_INDEFINITE_ARTICLE,
							TypeError
						);
					} else if (capacity < 0) {
						throw capacityErrorMaker("negative", HELPER_ERROR_MAKER_OPTION_NEGATED, RangeError);
					} else if (capacity < private_capacity) {
						let difference = M.min(private_capacity, private_getDefinedProperty("size")) - capacity;

						for (let i = 0; i < difference; ++i) {
							let index = private_getOldestIndex();
							this.unset(private_cache[index - 1]);
						}
					}

					private_capacity = M.min(M.round(capacity), MAX_CAPACITY);
				};
			})()
		});

		private_setDefinedProperty(
			propertyName,
			(options && typeof options[propertyName] !== UNDEFINED_TYPE)
				? options[propertyName]
				: MAX_CAPACITY
		);
	}


	let private_maxAge = global.Infinity;

	{
		let propertyName = "maxAge";

		private_definePropertyHere(propertyName, {
			get: (() => private_maxAge),
			set: (() => {
				let maxAgeErrorMaker = helper_getPropertyErrorMaker(propertyName);

				return (maxAge) => {
					if (maxAge === private_maxAge) {
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

					private_maxAge = maxAge;
				};
			})()
		});

		if (options && typeof options[propertyName] !== UNDEFINED_TYPE)
			private_setDefinedProperty(propertyName, options[propertyName]);
	}


	let private_automaticGarbageCollection = false,
		private_automaticGarbageCollectionInterval = AUTOMATIC_GARBAGE_COLLECTION_DEFAULT_INTERVAL,
		private_automaticGarbageCollectionTimeoutId = 0,
		private_automaticGarbageCollectionTimeoutHandler = (() => {
			private_stopAutomaticGarbageCollection();

			if (private_automaticGarbageCollection) {
				this.collectGarbage();
				private_startAutomaticGarbageCollection();
			}
		}),
		private_startAutomaticGarbageCollection = () => {
			private_automaticGarbageCollectionTimeoutId = global.setTimeout(
				private_automaticGarbageCollectionTimeoutHandler,
				private_automaticGarbageCollectionInterval
			);
		},
		private_stopAutomaticGarbageCollection = () => {
			if (private_automaticGarbageCollectionTimeoutId)
				global.clearTimeout(private_automaticGarbageCollectionTimeoutId);
		};

	{
		let mainPropertyName = "automaticGarbageCollection",
			intervalPropertyName = mainPropertyName + "Interval";

		private_definePropertyHere(mainPropertyName, {
			get: (() => private_automaticGarbageCollection),
			set: (value) => {
				((private_automaticGarbageCollection = !!value) // intentional assignment in condition
					? private_startAutomaticGarbageCollection
					: private_stopAutomaticGarbageCollection)();
			}
		});

		if (options && typeof options[mainPropertyName] !== UNDEFINED_TYPE)
			private_setDefinedProperty(mainPropertyName, options[mainPropertyName]);

		private_definePropertyHere(intervalPropertyName, {
			get: (() => private_automaticGarbageCollectionInterval),
			set: (() => {
				let intervalErrorMaker = helper_getPropertyErrorMaker(intervalPropertyName);

				return (interval) => {
					if (private_automaticGarbageCollectionInterval === interval) {
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

					private_automaticGarbageCollectionInterval = interval;
				};
			})()
		});

		if (options && typeof options[intervalPropertyName] !== UNDEFINED_TYPE)
			private_setDefinedProperty(intervalPropertyName, options[intervalPropertyName]);
	}

	/* private methods */

	let private_getOldestIndex = () => {
		let index = 1,
			updated = N.MAX_VALUE || global.Infinity;

		for (let i = index, l = private_cache.length; i < l; i += 2) {
			if (private_cache[i].metadata.updated < updated) {
				updated = private_cache[i].metadata.updated;
				index = i;
			}
		}

		return index;
	};
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

