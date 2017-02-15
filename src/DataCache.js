(function() {

	// return values of typeof function on various types
	// for use in comparisons and conditionals
	const OBJECT_TYPE = "object",
		FUNCTION_TYPE = "function",
		STRING_TYPE = "string",
		NUMBER_TYPE = "number",
		UNDEFINED_TYPE = "undefined";

	(function(global, module, D, M, O) {

		"use strict";

		// boolean below set to true if, and only if, code is running in Node.js
		const IS_NODE = ( 
				typeof module === OBJECT_TYPE
				&& typeof module.exports === OBJECT_TYPE
				&& typeof process === OBJECT_TYPE
				&& typeof process.versions == OBJECT_TYPE
				&& !isNaN(parseFloat(process.versions.node, 10))
			);

		// cache key can be set to accept one of the following types
		const ALLOWABLE_KEY_TYPES = [STRING_TYPE, NUMBER_TYPE/*, "symbol"*/];

		// used to ensure that underlying array does not exceed maximum allowed (i.e. 4.29bn)
		const MAX_ARRAY_LENGTH = ((1 << 16) * (1 << 16)) - 1;

		let exists = ((data) => {
				let o = {};
				for (let i = 0, l = data.length; i < l; ++i) {
					let d = data[i];
					o[d.key] = (typeof d.object[d.key] === FUNCTION_TYPE);
				}
				return o;
			})([
				{ key: "assign", object: O },
				{ key: "freeze", object: O },
				{ key: "now", object: D }
			]),
			keyTypeTest = (key, type) => {
				if (typeof key !== type) {
					throw new TypeError("Key must be a " + type + ".");
				}
			},
			search = (cacheArray, key) => {
				let lowerBound = 0,
					upperBound = (cacheArray.length / 2) - 1,
					midpoint;

				for (;;) { // intentional infinite loop
					midpoint = M.floor((lowerBound + upperBound) / 2) * 2;
					if (cacheArray[midpoint] === key) return midpoint + 1;
					if (lowerBound >= upperBound) return -1;

					if (key < cacheArray[midpoint]) {
						upperBound = midpoint - 1;
					} else if (key > cacheArray[midpoint]) {
						lowerBound = midpoint + 1;
					}
				}
			}, // binary search (only considers even-numbered indices, i.e. keys)
			sort = (cacheArray) => {
				let key, value;
				for (let i = 0, l = cacheArray.length, j, k; i < l; i += 2) {
					key = cacheArray[i];
					value = cacheArray[i + 1];

					for (j = i - 2; j > -1; j -= 2) {
						if (cacheArray[j] <= key)
							break;

						for (k = j; k < j + 2; k++)
							cacheArray[k + 2] = cacheArray[k];
					}

					cacheArray[j + 2] = key;
					cacheArray[j + 3] = value;
				}
			}; // insertion sort
			// (used because array will always be almost sorted,
			//  so relatively inexpensive)

		/*
			new DataCache({
				size: 100,
				keyType: "number"
			});
		*/
		function DataCache(options) {
			let cacheSize = (() => {
					let s = (options) ? options.size : NaN,
						r = (s !== NUMBER_TYPE && !isNaN(s)) ? parseInt(s, 10) : s;
					r *= 2; // double to account for key-value consecutive pairs
					r = M.min(r, MAX_ARRAY_LENGTH);
					return M.max(r, 0); // disregard negatives
				})(),
				cache = this._debugCache = [],
				keyType = STRING_TYPE;

			let setKeyType = (() => {
					let errorMessage = "The only allowable key types are ";
					ALLOWABLE_KEY_TYPES.forEach(function(v, i, a) {
						let wrappedV = "\"" + v + "\"";
						if (i < a.length - 2) {
							errorMessage += wrappedV + ", ";
						} else if (i < a.length - 1) {
							errorMessage += wrappedV;
						} else {
							errorMessage += " and " + wrappedV + ".";
						}
					});

					return function(type) {
						let isTypeAllowable = ALLOWABLE_KEY_TYPES.some(function(v) {
							return (type === v);
						});

						if (isTypeAllowable)
							keyType = type.toLowerCase();
						else
							throw global.TypeError(errorMessage);
					};
				})();

			if (options && typeof options.keyType === STRING_TYPE)
				setKeyType(options.keyType);

			/* public functions */

			this.get = (key, dataOnly) => {
				keyTypeTest(key, keyType);

				let index = search(cache, key);

				return (index === -1)
					? undefined
					: (dataOnly) ? cache[index].data : cache[index];
			};

			this.has = (key) => {
				keyTypeTest(key, keyType);

				return (search(cache, key) > -1);
			};

			this.set = (key, data) => {
				if (!keyType) setKeyType(typeof key); 
				keyTypeTest(key, keyType);

				let index = search(cache, key);
				if (index === -1) index = cache.length + 1;

				// ensure that cache never grows beyond maximum bound
				if (index >= cacheSize)
					throw new global.Error("Maximum number of elements reached.");

				// use ECMAScript 5 freeze function to make objects immutable,
				// therefore stored data can only be changed by re-setting it
				if (typeof data === OBJECT_TYPE && exists.freeze)
					O.freeze(data);
				
				let object = {
						data: data,
						updated: (exists.now) ? D.now() : new D().getTime()
					};

				object.created = (cache[index] && cache[index].created)
					? cache[index].created
					: object.updated;

				cache[index - 1] = key, cache[index] = object;
				sort(cache);
				return object;
			};

			this.unset = (key) => {
				let index = search(cache, key),
					length = cache.length;

				if (index === -1) return false;

				if (length > 2) {
					// swap current indices with final two indices in order to pop
					for (i = 1, temp; i >= 0; i--) {
						temp = cache[index - i];
						cache[index - i] = cache[length - i - 1];
						cache[length - i - 1] = temp;
					}
				}

				for (let i = 0; i < 2; i++)
					cache.pop();

				return !(sort(cache)); // true
			};

			this.iterate = (callback, dataOnly) => {
				for (let i = 1, l = cache.length; i < l; i += 2) {
					if (typeof cache[i] === UNDEFINED_TYPE)
						continue;

					callback((dataOnly) ? cache[i].data : cache[i]);
				}
			};

			this.clear = () => {
				return !!(cache = []); // true
			};
		};

		(function(prototype) {

			if (exists.assign)
				O.assign(DataCache.prototype, prototype);
			else
				for (let key in prototype)
					DataCache.prototype[key] = prototype[key];

		})({

			getData: function(key) {
				return this.get(key, true);
			},

			getMetadata: function(key) {
				let o = this.get(key),
					m = {};

				if (!o)
					return o;

				for (let k in o)
					if (k !== "data")
						m[k] = o[k];

				return m;
			}

		});

		if (IS_NODE) {
			module.exports = DataCache;
		} else {
			global.DataCache = DataCache;
		}

	})(
		(typeof window === OBJECT_TYPE)
			? window
			: (typeof global === OBJECT_TYPE)
				? global
				: this,
		this.module,
		Date,
		Math,
		Object
	);

})();
