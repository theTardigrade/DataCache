(function() {

	// return values of typeof function on various types
	// for use in comparisons and conditionals
	const OBJECT_TYPE = "object",
		FUNCTION_TYPE = "function",
		STRING_TYPE = "string",
		NUMBER_TYPE = "number",
		UNDEFINED_TYPE = "undefined";

	(function(global, module, D, M) {

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
	
		var exists = {
				now: (typeof D.now === FUNCTION_TYPE),
				freeze: (typeof Object.freeze === FUNCTION_TYPE)
			},
			keyTypeTest = function(key, type) {
				if (typeof key !== type) {
					throw new TypeError("Key must be a " + type + ".");
				}
			},
			search = function(cacheArray, key) {
				var lowerBound = 0,
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
			sort = function(cacheArray) {
				var key/*, strungKey*/, value;
				for (var i = 0, l = cacheArray.length, j, k; i < l; i += 2) {
					key = cacheArray[i];
				//	strungKey = key.toString();
					value = cacheArray[i + 1];
	
					for (j = i - 2; j > -1; j -= 2) {
						if (cacheArray[j]/*.toString()*/ <= /*strungKey*/key) break;
						for (k = j; k < j + 2; k++) {
							cacheArray[k + 2] = cacheArray[k];
						}
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
			var cacheSize = (function() {
					var s = (options) ? options.size : NaN,
						r = (s !== NUMBER_TYPE && !isNaN(s)) ? parseInt(s, 10) : s;
					r = M.min(r, M.pow(2, 32) - 1); // maximum array length (4.29bn)
					return M.max(r, 0); // disregard negatives
				})(),
				cache = this._debugCache = (isNaN(cacheSize)) ? [] : new Array(cacheSize),
				keyType = STRING_TYPE;
	
			var setKeyType = (function() {
				var errorMessage = "The only allowable key types are ";
				ALLOWABLE_KEY_TYPES.forEach(function(v, i, a) {
					var wrappedV = "\"" + v + "\"";
					if (i < a.length - 2) {
						errorMessage += wrappedV + ", ";
					} else if (i < a.length - 1) {
						errorMessage += wrappedV;
					} else {
						errorMessage += " and " + wrappedV + ".";
					}
				});
	
				return function(type) {
					var isTypeAllowable = ALLOWABLE_KEY_TYPES.some(function(v) {
						return (type === v);
					});
	
					if (isTypeAllowable) { keyType = type.toLowerCase(); }
					else { throw TypeError(errorMessage); }
				};
			})();
	
			if (options && options.keyType) setKeyType(options.keyType);
	
			/* public functions */
	
			this.get = function(key, dataOnly) {
				keyTypeTest(key, keyType);
	
				var index = search(cache, key);
	
				return (index === -1)
					? undefined
					: (dataOnly) ? cache[index].data : cache[index];
			};
	
			this.set = function(key, data) {
				if (!keyType) setKeyType(typeof key); 
				keyTypeTest(key, keyType);
	
				var index = search(cache, key);
				if (index === -1) index = cache.length + 1;
	
				// use ECMAScript 5 freeze function to make objects immutable,
				// therefore stored data can only be changed by re-setting it
				if (typeof data === OBJECT_TYPE && exists.freeze)
					global.Object.freeze(data);
				
				var object = {
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
	
			this.unset = function(key) {
				var index = search(cache, key),
					length = cache.length,
					i;
	
				if (index === -1) return false;
	
				if (length > 2) {
					// swap current indices with final two indices in order to pop
					for (i = 1, temp; i >= 0; i--) {
						temp = cache[index - i];
						cache[index - i] = cache[length - i - 1];
						cache[length - i - 1] = temp;
					}
				}
	
				for (i = 0; i < 2; i++) cache.pop();
				return !(sort(cache)); // true
			};

			this.iterate = function(callback, dataOnly) {
				for (var i = 0, l = cache.length; i < l; ++i) {
					if (typeof cache[i] === UNDEFINED_TYPE)
						continue;

					callback((dataOnly) ? cache[index].data : cache[index]);
				}
			};
	
			this.clear = function() {
				return !!(cache = []); // true
			};
		};
	
		(function(prototype) {
	
			for (var key in prototype)
				DataCache.prototype[key] = prototype[key];
	
		})({
	
			getData: function(key) {
				var o = this.get(key);
				return (!o) ? o : o.data;
			},
	
			getMetadata: function(key) {
				var o = this.get(key), m = {};
				if (!o) return o;
	
				for (var k in o) if (k !== "data") m[k] = o[k];
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
		Math
	);

})();