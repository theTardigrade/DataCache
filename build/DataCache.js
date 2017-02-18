(function() {
	var OBJECT_TYPE = "object",
		FUNCTION_TYPE = "function",
		STRING_TYPE = "string",
		NUMBER_TYPE = "number",
		UNDEFINED_TYPE = "undefined";
	(function(global, module, Error, TypeError, D, M, O, N) {
		"use strict";
		var IS_NODE =
			typeof module === OBJECT_TYPE
			&& typeof module.exports === OBJECT_TYPE
			&& typeof process === OBJECT_TYPE
			&& typeof process.versions == OBJECT_TYPE
			&& !isNaN(parseFloat(process.versions.node, 10));
		var ALLOWABLE_KEY_TYPES = [STRING_TYPE, NUMBER_TYPE];
		var MAX_ARRAY_LENGTH = (1 << 16) * (1 << 16) - 1,
			MAX_CAPACITY = M.floor(MAX_ARRAY_LENGTH) / 2;
		var exists = (function(data) {
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
			}
		]);
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

		function DataCache(options) {
			var _this = this;
			var cache = this._debugCache = [];
			this.get = function(key, options) {
				var value = null;
				if (typeof key !== getDefinedProperty("keyType"))
					return value;
				var index = search(cache, key);
				if (index === -1)
					return value;
				value = cache[index];
				if (options) {
					var optionCount = 0;
					if (options.metadataOnly) {
						var metadata = {};
						++optionCount;
						for (var vKey in value) {
							if (vKey !== "data")
								metadata[vKey] = value[vKey];
						}
						return metadata;
					}
					if (options.dataOnly) {
						if (optionCount)
							throw new Error(
								"The \"dataOnly\" and \"metadataOnly\" options are mutually contradictory.");
						value = value.data;
					}
				}
				return value;
			};
			this.has = function(key) {
				var keyType = getDefinedProperty("keyType");
				return typeof key === keyType && search(cache, key) > -1;
			};
			this.set = function(key, data) {
				var keyType = getDefinedProperty("keyType");
				if (typeof keyType !== STRING_TYPE)
					setDefinedProperty("keyType", keyType = typeof key);
				if (typeof key !== keyType)
					throw new TypeError("Key must be a " + keyType + ".");
				var index = search(cache, key);
				if (index === -1)
					index = cache.length + 1;
				if (index >= getDefinedProperty("capacity") * 2)
					index = getDefinedProperty("_oldestIndex");
				if (typeof data === OBJECT_TYPE && exists.freeze)
					O.freeze(data);
				var object = {
					data: data,
					updated: exists.now ? D.now() : new D().getTime()
				};
				object.created = cache[index] && cache[index].created
					? cache[index].created
					: object.updated;
				cache[index - 1] = key;
				cache[index] = object;
				sort(cache);
				return object;
			};
			this.unset = function(key) {
				if (typeof key !== getDefinedProperty("keyType"))
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
				for (var _i = 0; _i < 2; ++_i) {
					cache.pop();
				}
				return !sort(cache);
			};
			this.iterate = function(callback, options) {
				var keyType = getDefinedProperty("keyType"),
					boundThis = this,
					curriedGet = function(key) {
						return boundThis.get(key, options);
					};
				for (var i = 0, l = cache.length; i < l; i += 2) {
					var key = cache[i];
					if (typeof key !== keyType)
						continue;
					callback(key, curriedGet(key));
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
					if (exists.defineProperty) {
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
					return exists.defineProperty
						? _this[prop]
						: _this[getFallbackDefinedPropertyName("get", prop)]();
				},
				setDefinedProperty = function(prop, value) {
					return exists.defineProperty
						? _this[prop] = value
						: _this[getFallbackDefinedPropertyName("set", prop)](value);
				};
			var privateKeyType = null;
			definePropertyHere("keyType", {
				get: function() {
					return privateKeyType;
				},
				set: (function() {
					var errorMessage = "The only allowable key types are ";
					for (var i = 0, l = ALLOWABLE_KEY_TYPES.length, t; i < l; ++i) {
						t = "\"" + ALLOWABLE_KEY_TYPES[i] + "\"";
						errorMessage += i < l - 2
							? t + ", "
							: i < l - 1
							? t
							: " and " + t + ".";
					}
					return function(keyType) {
						var isTypeAllowable = (function() {
							for (var _i2 = 0, _l = ALLOWABLE_KEY_TYPES.length; _i2 < _l; ++_i2) {
								if (keyType === ALLOWABLE_KEY_TYPES[_i2])
									return true;
							}
							return false;
						})();
						if (keyType === privateKeyType)
							return;
						if (isTypeAllowable)
							privateKeyType = keyType.toLowerCase();
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
				}
			});
			var privateCapacity = 0;
			definePropertyHere("capacity", {
				get: function() {
					return privateCapacity;
				},
				set: function(capacity) {
					if (typeof capacity !== NUMBER_TYPE || capacity < 0 || capacity === privateCapacity) {
						return false;
					} else if (capacity < privateCapacity) {
						var difference = privateCapacity - capacity;
						for (var i = 0, l = M.min(_this.size, capacity); i < l; i += 2) {
							var index = _this._getOldestIndex();
							_this.unset(cache[index - 1]);
						}
					}
					var value = capacity !== NUMBER_TYPE && !isNaN(capacity)
						? parseInt(capacity, 10)
						: capacity;
					value = M.min(value, MAX_CAPACITY);
					if (isNaN(value))
						throw new TypeError("Suggested capacity cannot be parsed.");
					privateCapacity = M.max(value, 0);
					return true;
				}
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
						if (cache[i].updated < updated) {
							updated = cache[i].updated;
							index = i;
						}
					}
					return index;
				}
			});
		}
		(function(prototype) {
			if (exists.assign)
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
			map: function(callback, options) {
				var _this2 = this;
				this.iterate((function(key, value) {
					var newValue = callback(key, value);
					if (!options || !options.dataOnly)
						newValue = newValue.data;
					if (typeof newValue !== UNDEFINED_TYPE)
						_this2.set(key, newValue);
				}), options);
			},
			filter: function(callback, options) {
				var filteredKeys = [];
				this.iterate((function(key, value) {
					if (!callback(key, value))
						filteredKeys.push(key);
				}), options);
				for (var i = 0, l = filteredKeys.length; i < l; ++i) {
					this.unset(filteredKeys[i]);
				}
			},
			isFull: function() {
				return exists.defineProperty
					? this.size === this.capacity
					: this.getSize() === this.getCapacity();
			},
			isEmpty: function() {
				return (exists.defineProperty ? this.size : this.getSize()) === 0;
			},
			supportsNativeGettersAndSetters: function() {
				return exists.defineProperty;
			}
		});
		if (IS_NODE) {
			module.exports = DataCache;
		} else {
			global.DataCache = DataCache;
		}
	})(
		typeof window === OBJECT_TYPE
		? window
		: typeof global === OBJECT_TYPE
		? global
		: this,
		this.module,
		Error,
		TypeError,
		Date,
		Math,
		Object,
		Number);
})();