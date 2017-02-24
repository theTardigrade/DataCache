(function() {

	var OBJECT_TYPE = "object",
		FUNCTION_TYPE = "function",
		STRING_TYPE = "string",
		NUMBER_TYPE = "number",
		UNDEFINED_TYPE = "undefined";

	(function(global, module, define, Error, TypeError, RangeError, D, M, O, A, N) {

		"use strict";

		var EXISTS = (function(data) {
			var o = {};
			for (var i = 0, l = data.length; i < l; ++i) {
				var d = data[i];
				o[d.key] = typeof(d.object || O)[d.key] === (d.type || FUNCTION_TYPE);
			}
			return o;
		})([{
				key: "assign"
			},
			{
				key: "defineProperty"
			},
			{
				key: "freeze"
			},
			{
				key: "now",
				object: D
			},
			{
				key: "includes",
				object: A.prototype
			},
			{
				key: "isArray",
				object: A
			}
		]);

		var ALLOWABLE_KEY_TYPES = [
			STRING_TYPE,
			NUMBER_TYPE
		];

		if (!EXISTS.includes) {
			var includes = function(predicative) {
				for (var i = 0, l = this.length; i < l; ++i) {
					if (predicative === this[i])
						return true;
				}
				return false;
			};

			ALLOWABLE_KEY_TYPES.includes = includes;
		}

		var MAX_ARRAY_LENGTH = (1 << 16) * (1 << 16) - 1,
			MAX_CAPACITY = M.floor(MAX_ARRAY_LENGTH / 2);

		var search = function(cacheArray, key) {
			var lowerBound = 0,
				upperBound = cacheArray.length - 1;

			for (;;) {
				var midpoint = M.floor((lowerBound + upperBound) / 4) * 2;

				if (cacheArray[midpoint] === key)
					return midpoint + 1;

				if (lowerBound >= upperBound)
					return -1;

				if (key < cacheArray[midpoint])
					upperBound = midpoint - 2;
				else
				if (key > cacheArray[midpoint])
					lowerBound = midpoint + 2;
			}
		};

		var sort = function(cacheArray) {
			for (var i = 0, l = cacheArray.length, j, k; i < l; i += 2) {
				var key = cacheArray[i],
					value = cacheArray[i + 1];

				for (j = i - 2; j > -1; j -= 2) {
					if (cacheArray[j] <= key)
						break;

					for (k = j; k < j + 2; k++) {
						cacheArray[k + 2] = cacheArray[k];
					}
				}

				cacheArray[j + 2] = key;
				cacheArray[j + 3] = value;
			}
		};

		var arrayToHumanString = function(array) {
			var str = "";

			if (EXISTS.isArray ? A.isArray(array) : O.prototype.toString.call(array) ===
				"[object Array]") {
				for (var i = 0, l = array.length, tmp; i < l; ++i) {
					tmp = "\"" + array[i] + "\"";
					str += i < l - 2
						? tmp + ", "
						: i < l - 1
						? tmp
						: " and " + tmp;
				}
			}

			return str;
		};

		var deepFreeze = function(object) {
			for (var key in object) {
				if (typeof object === OBJECT_TYPE)
					deepFreeze(object[key]);
			}

			if (!O.isFrozen(object))
				O.freeze(object);
		};

		function DataCache(options) {
			var _this = this;
			var cache = this._debugCache = [];

			this.get = (function() {
				var onlyPropertyNames = ["data", "metadata"],
					onlyOptionNames = new A(onlyPropertyNames.length);

				for (var i = 0, l = onlyOptionNames.length; i < l; ++i) {
					onlyOptionNames[i] = onlyPropertyNames[i] + "Only";
				}

				return function(key, options) {
					var value = null;

					if (typeof key !== privateKeyType)
						return value;

					var index = search(cache, key);

					if (index === -1)
						return value;

					value = cache[index];

					if (options) {
						for (var _i = 0, setOnlyOptionCount = 0, _l = onlyOptionNames.length; _i < _l; ++_i) {
							if (options[onlyOptionNames[_i]]) {
								if (setOnlyOptionCount++)
									throw new Error("The " + arrayToHumanString(onlyOptionNames) +
										" options are mutually contradictory.");
								value = value[onlyPropertyNames[_i]];
							}
						}
					}

					return value;
				};
			})();

			this.has = function(key) {
				return typeof key === privateKeyType && search(cache, key) > -1;
			};

			this.set = function(key, data) {
				if (typeof privateKeyType !== STRING_TYPE)
					setDefinedProperty("keyType", typeof key);

				if (typeof key !== privateKeyType)
					throw new TypeError("Key must be a " + privateKeyType + ".");

				if (typeof data === UNDEFINED_TYPE || data === null)
					return this.unset(key);

				var index = search(cache, key);

				if (index === -1)
					index = cache.length + 1;

				if (index >= privateCapacity * 2)
					index = getDefinedProperty("_oldestIndex");

				var object = {
						data: data
					},

					metadata = object.metadata = {
						updated: EXISTS.now ? D.now() : new D().getTime()
					},

					cachedMetadata = cache[index] && cache[index].metadata && typeof cache[index].metadata.created
					=== NUMBER_TYPE
					? cache[index].metadata
					: metadata;

				metadata.created = cachedMetadata.created || cachedMetadata.updated;

				if (EXISTS.freeze)
					deepFreeze(object);

				cache[index - 1] = key;
				cache[index] = object;

				sort(cache);
				return object;
			};

			this.unset = function(key) {
				if (typeof key !== privateKeyType)
					return false;

				var index = search(cache, key),
					length = cache.length;

				if (index === -1)
					return false;

				if (length > 2) {
					for (var i = 1, temp; i >= 0; --i) {
						temp = cache[index - i];
						cache[index - i] = cache[length - i - 1];
						cache[length - i - 1] = temp;
					}
				}

				for (var _i2 = 0; _i2 < 2; ++_i2) {
					cache.pop();
				}

				return !sort(cache);
			};

			this.iterate = function(callback, options) {
				for (var i = 0, l = cache.length, key; i < l; i += 2) {
					key = cache[i];
					callback(key, this.get(key, options));
				}
			};

			this.map = function(callback, options) {
				for (var i = 0, l = cache.length, key, newValue; i < l; i += 2) {
					key = cache[i];
					newValue = callback(key, this.get(key, options));

					if (!options || !options.dataOnly)
						newValue = newValue.data;

					this.set(key, newValue);
				}
			};

			this.filter = function(callback, options) {
				for (var i = 0, l = cache.length, key; i < l; i += 2) {
					key = cache[i];

					if (!callback(key, this.get(key, options))) {
						cache.splice(i, 2);
						i -= 2, l -= 2;
					}
				}
			};

			this.clear = function() {
				return !!(cache = []);
			};

			var getFallbackDefinedPropertyName = function(prefix, prop) {
					var i = 0,
						u = prop.charAt(i) === "_" ? (
							++i, "_")
						: "";
					u += prefix + prop.charAt(i).toUpperCase();
					return u + prop.slice(i + 1);
				},
				definePropertyHere = function(prop, options) {
					if (EXISTS.defineProperty) {
						O.defineProperty(_this, prop, options);
					} else {
						var keys = ["g", "s"];

						for (var i = 0, l = keys.length, k; i < l; ++i) {
							k = keys[i] + "et";
							if (typeof options[k] === FUNCTION_TYPE)
								_this[getFallbackDefinedPropertyName(k, prop)] = options[k];
						}
					}
				},
				getDefinedProperty = function(prop) {
					return EXISTS.defineProperty
						? _this[prop]
						: _this[getFallbackDefinedPropertyName("get", prop)]();
				},
				setDefinedProperty = function(prop, value) {
					return EXISTS.defineProperty
						? _this[prop] = value
						: _this[getFallbackDefinedPropertyName("set", prop)](value);
				};

			var privateKeyType = null;

			definePropertyHere("keyType", {
				get: function() {
					return privateKeyType;
				},
				set: (function() {
					var errorMessage = "The only allowable key types are "
						+ arrayToHumanString(ALLOWABLE_KEY_TYPES) + ".";

					return function(keyType) {
						if (keyType === privateKeyType)
							return;

						if (ALLOWABLE_KEY_TYPES.includes(keyType))
							privateKeyType = keyType;
						else

							throw new TypeError(errorMessage);
					};
				})()
			});

			if (options && typeof options.keyType !== UNDEFINED_TYPE)
				setDefinedProperty("keyType", options.keyType);

			definePropertyHere("size", {
				get: function() {
					return cache.length / 2;
				},
				set: function(size) {
					if (size >= getDefinedProperty("size"))
						return;

					var capacityStr = "capacity",
						setCapacity = function(capacity) {
							setDefinedProperty(capacityStr, capacity);
						},
						oldCapacity = getDefinedProperty(capacityStr);

					setCapacity(size);
					setCapacity(oldCapacity);
				}
			});

			var privateCapacity = 0;

			definePropertyHere("capacity", {
				get: function() {
					return privateCapacity;
				},
				set: (function() {
					var injunctionErrorMaker = function(x, e) {
						return new e("Capacity must be " + x + ".");
					};

					return function(capacity) {
						if (capacity === privateCapacity) {
							return;
						} else if (typeof capacity !== NUMBER_TYPE || isNaN(capacity)) {
							throw injunctionErrorMaker("a number (excluding NaN)", TypeError);
						} else if (capacity < 0) {
							throw injunctionErrorMaker("non-negative", RangeError);
						} else if (capacity < privateCapacity) {
							var difference = M.min(privateCapacity, _this.size) - capacity;

							for (var i = 0; i < difference; ++i) {
								var index = getDefinedProperty("_oldestIndex");
								_this.unset(cache[index - 1]);
							}
						}

						privateCapacity = M.min(M.round(capacity), MAX_CAPACITY);
					};
				})()
			});

			setDefinedProperty(
				"capacity",
				options && typeof options.capacity !== UNDEFINED_TYPE
				? options.capacity
				: MAX_CAPACITY);

			definePropertyHere("_oldestIndex", {
				get: function() {
					var index = 1,
						updated = N.MAX_VALUE || global.Infinity;

					for (var i = index, l = cache.length; i < l; i += 2) {
						if (cache[i].metadata.updated < updated) {
							updated = cache[i].metadata.updated;
							index = i;
						}
					}

					return index;
				}
			});

		}

		(function(methodName) {
			var objects = [DataCache, DataCache.prototype],
				method = function() {
					return EXISTS.defineProperty;
				};

			for (var i = 0, l = objects.length; i < l; ++i) {
				objects[i][methodName] = method;
			}
		})("supportsNativeGettersAndSetters");

		(function(prototype) {

			if (EXISTS.assign)
				O.assign(DataCache.prototype, prototype);
			else

				for (var key in prototype) {
					DataCache.prototype[key] = prototype[key];
				}

		})({

			getData: (function(options) {
				return function(key) {
					return this.get(key, options);
				};
			})({
				dataOnly: true
			}),

			getMetadata: (function(options) {
				return function(key) {
					return this.get(key, options);
				};
			})({
				metadataOnly: true
			}),

			isFull: function() {
				return EXISTS.defineProperty
					? this.size === this.capacity
					: this.getSize() === this.getCapacity();
			},

			isEmpty: function() {
				return (EXISTS.defineProperty ? this.size : this.getSize()) === 0;
			}
		});

		if (typeof module === OBJECT_TYPE && typeof module.exports === OBJECT_TYPE) {
			module.exports = DataCache;
		} else if (typeof define === FUNCTION_TYPE && define.amd) {
			define(["DataCache"], [], DataCache);
		} else {
			global.DataCache = DataCache;
		}

	})(
		typeof this.window === OBJECT_TYPE
		? this.window
		: typeof this.global === OBJECT_TYPE
		? this.global
		: this,
		this.module,
		this.define,
		Error,
		TypeError,
		RangeError,
		Date,
		Math,
		Object,
		Array,
		Number);

})();