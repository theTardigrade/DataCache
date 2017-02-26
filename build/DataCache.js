(function(global, module, define, Error, TypeError, RangeError, D, M, O, A, N) {

	"use strict";

	var OBJECT_TYPE = "object",
		FUNCTION_TYPE = "function",
		STRING_TYPE = "string",
		NUMBER_TYPE = "number",
		UNDEFINED_TYPE = "undefined";

	var NULL_NAME = "null";

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

	var HELPER_NO_OPTION = 0;

	var HELPER_ARRAY_TO_HUMAN_STRING_OPTION_ALTERNATIVES = 1;

	var HELPER_ERROR_MAKER_OPTION_PROPERTY = 1,
		HELPER_ERROR_MAKER_OPTION_NEGATED = 2,
		HELPER_ERROR_MAKER_OPTION_ALTERNATIVES = 4,
		HELPER_ERROR_MAKER_OPTION_ONE_MAX = 8,
		HELPER_ERROR_MAKER_OPTION_CONTAIN = 16,
		HELPER_ERROR_MAKER_OPTION_INDEFINITE_ARTICLE = 32;

	var HELPER_GET_CURRENT_TIMESTAMP_OPTION_SECONDS = 1;

	var helper_search = function(cacheArray, key) {
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

	var helper_sort = function(cacheArray) {
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

	var helper_deepFreeze = function(object) {
		for (var key in object) {
			if (typeof object === OBJECT_TYPE)
				helper_deepFreeze(object[key]);
		}

		O.freeze(object);
	};

	var helper_isArray = (function() {
		var nativeKey = "isArray";

		if (EXISTS[nativeKey])
			return A[nativeKey];

		return function(thing) {
			O.prototype.toString.call(thing) === "[object Array]";
		};
	})();

	var helper_arrayToHumanString = function(array, bitmaskOptions) {
		var str = "";

		if (helper_isArray(array)) {
			for (var i = 0, l = array.length, tmp; i < l; ++i) {
				tmp = "\"" + array[i].toString() + "\"";
				str += i < l - 2
					? tmp + ", "
					: i < l - 1
					? tmp
					: " " + (
						bitmaskOptions & HELPER_ARRAY_TO_HUMAN_STRING_OPTION_ALTERNATIVES
						? "or"
						: "and")
					+ " " + tmp;
			}
		}

		return str;
	};

	var helper_errorMaker = function(thing, predicative, bitmaskOptions, ConstructorFunc) {
		var msg = (bitmaskOptions & HELPER_ERROR_MAKER_OPTION_PROPERTY ? "Property [" + thing + "]"
				: thing)
			+ " " + (bitmaskOptions & HELPER_ERROR_MAKER_OPTION_NEGATED ? "cannot" : "must")
			+ " " + (bitmaskOptions & HELPER_ERROR_MAKER_OPTION_CONTAIN ? "contain" : "be")
			+ " " + (bitmaskOptions & HELPER_ERROR_MAKER_OPTION_ONE_MAX ? "more than " : "") + (
				bitmaskOptions & HELPER_ERROR_MAKER_OPTION_INDEFINITE_ARTICLE ? "a " : "") + (
				bitmaskOptions & HELPER_ERROR_MAKER_OPTION_ALTERNATIVES
				? "one of the following: "
				+ helper_arrayToHumanString(predicative, HELPER_ARRAY_TO_HUMAN_STRING_OPTION_ALTERNATIVES)
				: predicative)
			+ ".",
			isConstructorValid = typeof ConstructorFunc === FUNCTION_TYPE
			&& typeof ConstructorFunc.name === STRING_TYPE
			&& ConstructorFunc.name.slice(-5) === "Error";

		return new(isConstructorValid ? ConstructorFunc : Error)(msg);
	};

	var helper_assignObject = (function() {
		var nativeKey = "assign";

		if (EXISTS[nativeKey])
			return O[nativeKey];

		return function(target) {
			for (var _len = arguments.length, sources = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key
				< _len; _key++) {
				sources[_key - 1] = arguments[_key];
			}
			if (target == null)
				throw helper_errorMaker(
					"Target object", [UNDEFINED_TYPE, NULL_NAME],
					HELPER_ERROR_MAKER_OPTION_ALTERNATIVES | HELPER_ERROR_MAKER_OPTION_NEGATED,
					TypeError);

			var t = O(target);

			for (var i = 0, l = sources.length, s; i < l; ++i) {
				if ((s = sources[i]) == null)
					continue;

				for (var key in s) {
					if (O.prototype.hasOwnProperty.call(s, key))
						t[key] = s[key];
				}
			}

			return t;
		};
	})();

	var helper_getCurrentTimestamp = (function() {
		var nativeKey = "now",
			nativeKeyExists = EXISTS[nativeKey];

		return function(bitmaskOptions) {
			var timestamp = (nativeKeyExists ? D[nativeKey] : new D().getTime)();
			return timestamp;
		};
	})();

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

				var index = helper_search(cache, key);

				if (index === -1)
					return value;

				value = cache[index];

				if (helper_getCurrentTimestamp() - value.metadata.updated > privateMaxAge) {
					this.unset(key);
					return null;
				}

				if (options) {
					for (var _i = 0, setOnlyOptionCount = 0, _l = onlyOptionNames.length; _i < _l; ++_i) {
						if (options[onlyOptionNames[_i]]) {
							if (setOnlyOptionCount++)
								throw helper_errorMaker(
									"Options",
									onlyOptionNames,
									HELPER_ERROR_MAKER_OPTION_ONE_MAX | HELPER_ERROR_MAKER_OPTION_NEGATED
									| HELPER_ERROR_MAKER_OPTION_ALTERNATIVES | HELPER_ERROR_MAKER_OPTION_CONTAIN);

							value = value[onlyPropertyNames[_i]];
						}
					}
				}

				return value;
			};
		})();

		this.has = function(key) {
			return typeof key === privateKeyType && helper_search(cache, key) > -1;
		};

		this.set = function(key, data) {
			if (typeof privateKeyType !== STRING_TYPE)
				setDefinedProperty("keyType", typeof key);

			if (typeof key !== privateKeyType)
				throw helper_errorMaker(
					"Key",
					privateKeyType,
					HELPER_ERROR_MAKER_OPTION_INDEFINITE_ARTICLE,
					TypeError);

			if (data == null)
				throw helper_errorMaker(
					"Data", [UNDEFINED_TYPE, NULL_NAME],
					HELPER_ERROR_MAKER_OPTION_ALTERNATIVES | HELPER_ERROR_MAKER_OPTION_NEGATED,
					TypeError);

			var index = helper_search(cache, key);

			if (index === -1)
				index = cache.length + 1;

			if (index >= privateCapacity * 2)
				index = getDefinedProperty("_oldestIndex");

			var object = {
					data: data
				},

				metadata = object.metadata = {
					updated: helper_getCurrentTimestamp()
				},

				cachedMetadata = cache[index] && cache[index].metadata && typeof cache[index].metadata.created
				=== NUMBER_TYPE
				? cache[index].metadata
				: metadata;

			metadata.created = cachedMetadata.created || cachedMetadata.updated;

			if (EXISTS.freeze)
				helper_deepFreeze(object);

			cache[index - 1] = key;
			cache[index] = object;

			helper_sort(cache);
			return object;
		};

		this.unset = function(key) {
			var value = null;

			if (typeof key !== privateKeyType)
				return value;

			var index = helper_search(cache, key),
				length = cache.length;

			if (index === -1)
				return value;

			if (length > 2) {
				for (var i = 1, tmp; i >= 0; --i) {
					tmp = cache[index - i];
					cache[index - i] = cache[length - i - 1];
					cache[length - i - 1] = tmp;
				}
			}

			value = cache.pop();
			cache.pop();

			helper_sort(cache);
			return value;
		};

		this.clean = function() {
			for (var i = 1, l = cache.length; i < l; i += 2) {
				if (helper_getCurrentTimestamp() - cache[i].metadata.updated > privateMaxAge)
					this.unset(cache[i - 1]);
			}
		};

		this.iterate = function(callback, options) {
			for (var i = 0, l = cache.length, key, value; i < l; i += 2) {
				key = cache[i];
				value = this.get(key, options);

				if (value !== null)
					callback(key, value);
			}
		};

		this.map = function(callback, options) {
			var returnsFullObject = !options || !options.dataOnly;

			for (var i = 0, l = cache.length, key, value, newValue; i < l; i += 2) {
				key = cache[i];
				value = this.get(key, options);

				if (value !== null) {
					newValue = callback(key, value);

					this.set(key, returnsFullObject ? newValue.data : newValue);
				}
			}
		};

		this.filter = function(callback, options) {
			for (var i = 0, l = cache.length, key, value, swap1, swap2, tmp; i < l;) {
				key = cache[i];
				value = this.get(key, options);

				if (value !== null && !callback(key, this.get(key, options))) {
					for (var j = 0; j < 2; ++j) {
						swap1 = i + j;
						swap2 = l - 2 + j;

						tmp = cache[swap1];
						cache[swap1] = cache[swap2];
						cache[swap2] = tmp;
					}

					l = cache.length -= 2;

					for (var _j = i, m = l - 2; _j < m; _j += 2) {
						for (var k = 0; k < 2; ++k) {
							swap1 = _j + k;
							swap2 = swap1 + 2;

							tmp = cache[swap1];
							cache[swap1] = cache[swap2];
							cache[swap2] = tmp;
						}
					}

					continue;
				}

				i += 2;
			}
		};

		this.clear = function() {
			cache = [];
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

		{
			var propertyName = "keyType";

			definePropertyHere(propertyName, {
				get: function() {
					return privateKeyType;
				},
				set: (function() {
					var error = helper_errorMaker(
						propertyName,
						ALLOWABLE_KEY_TYPES,
						HELPER_ERROR_MAKER_OPTION_ALTERNATIVES | HELPER_ERROR_MAKER_OPTION_PROPERTY,
						TypeError);

					return function(keyType) {
						if (keyType === privateKeyType && keyType !== null)
							return;

						if (ALLOWABLE_KEY_TYPES.includes(keyType))
							privateKeyType = keyType;
						else

							throw error;
					};
				})()
			});

			if (options && typeof options[propertyName] !== UNDEFINED_TYPE)
				setDefinedProperty(propertyName, options[propertyName]);
		}

		{
			var _propertyName = "size";

			definePropertyHere(_propertyName, {
				get: function() {
					var l = cache.length;

					if (l && privateMaxAge < global.Infinity) {
						var total = 0;

						for (var i = 1; i < l; i += 2) {
							if (helper_getCurrentTimestamp() - cache[i].metadata.updated <= privateMaxAge)
								++total;
						}

						return total;
					}

					return l / 2;
				},
				set: function(size) {
					if (size >= getDefinedProperty(_propertyName))
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

		}

		var privateCapacity = 0;

		{
			var _propertyName2 = "capacity";

			definePropertyHere(_propertyName2, {
				get: function() {
					return privateCapacity;
				},
				set: (function() {
					var capacityErrorMaker = function(predicative, bitmaskOptions, constructor) {
						return helper_errorMaker(
							_propertyName2,
							predicative,
							HELPER_ERROR_MAKER_OPTION_PROPERTY | bitmaskOptions,
							constructor);

					};

					return function(capacity) {
						if (capacity === privateCapacity) {
							return;
						} else if (typeof capacity !== NUMBER_TYPE || isNaN(capacity)) {
							throw capacityErrorMaker(NUMBER_TYPE + " (excluding NaN)",
								HELPER_ERROR_MAKER_OPTION_INDEFINITE_ARTICLE, TypeError);
						} else if (capacity < 0) {
							throw capacityErrorMaker("negative", HELPER_ERROR_MAKER_OPTION_NEGATED, RangeError);
						} else if (capacity < privateCapacity) {
							var difference = M.min(privateCapacity, getDefinedProperty("size")) - capacity;

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
				_propertyName2,
				options && typeof options[_propertyName2] !== UNDEFINED_TYPE
				? options[_propertyName2]
				: MAX_CAPACITY);

		}

		var privateMaxAge = global.Infinity;

		{
			var _propertyName3 = "maxAge";

			definePropertyHere(_propertyName3, {
				get: function() {
					return privateMaxAge;
				},
				set: (function() {
					var maxAgeErrorMaker = function(predicative, bitmaskOptions, constructor) {
						return helper_errorMaker(
							_propertyName3,
							predicative,
							HELPER_ERROR_MAKER_OPTION_PROPERTY | bitmaskOptions,
							constructor);

					};

					return function(maxAge) {
						if (maxAge === privateMaxAge) {
							return;
						} else if (typeof maxAge !== NUMBER_TYPE || isNaN(maxAge)) {
							throw maxAgeErrorMaker(NUMBER_TYPE + " of milliseconds",
								HELPER_ERROR_MAKER_OPTION_INDEFINITE_ARTICLE, TypeError);
						} else if (maxAge < 0) {
							throw maxAgeErrorMaker("negative", HELPER_ERROR_MAKER_OPTION_NEGATED, RangeError);
						}

						privateMaxAge = maxAge;
					};
				})()
			});

			if (options && typeof options[_propertyName3] !== UNDEFINED_TYPE)
				setDefinedProperty(_propertyName3, options[_propertyName3]);
		}

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

	{
		var supportsNativeGettersAndSetters = (function(methodName) {
			var objects = [DataCache, DataCache.prototype],
				method = function() {
					return EXISTS.defineProperty;
				};

			for (var i = 0, l = objects.length; i < l; ++i) {
				objects[i][methodName] = method;
			}

			return method();
		})("supportsNativeGettersAndSetters");

		var prototype = {

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
				return supportsNativeGettersAndSetters
					? this.size === this.capacity
					: this.getSize() === this.getCapacity();
			},

			isEmpty: function() {
				return (supportsNativeGettersAndSetters ? this.size : this.getSize()) === 0;
			}
		};

		helper_assignObject(DataCache.prototype, prototype);
	}

	{
		var constructorName = "DataCache";

		if (typeof module === OBJECT_TYPE && typeof module.exports === OBJECT_TYPE) {
			module.exports = DataCache;
		} else if (typeof define === FUNCTION_TYPE && define.amd) {
			define([constructorName], [], DataCache);
		} else {
			global[constructorName] = DataCache;
		}
	}

})(
	this.window != null
	? this.window
	: this.global != null
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