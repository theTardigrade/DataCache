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
const MAX_ARRAY_LENGTH = ((1 << 16) * (1 << 16)) - 1,
	MAX_CAPACITY = M.floor(MAX_ARRAY_LENGTH / 2);

// object where keys are names of properties defined on global objects
// and values are booleans showing whether they're available or not
let exists = ((data) => {
		let o = {};
		for (let i = 0, l = data.length; i < l; ++i) {
			let d = data[i];
			o[d.key] = (typeof (d.object || O)[d.key] === (d.type || FUNCTION_TYPE));
		}
		return o;
	})([
		{ key: "assign" },
		{ key: "defineProperty" },
		{ key: "freeze" },
		{ key: "now", object: D }
	]);

// binary search, considering only even-numbered indices
// to account for the fact that in the array used to hold cache data
// odd-numbered indices contain keys and the successive odd-numbered
// index contains a corresponding value
let search = (cacheArray, key) => {
		let lowerBound = 0,
			upperBound = cacheArray.length - 1;

		for (;;) { // intentional infinite loop
			let midpoint = M.floor((lowerBound + upperBound) / 4) * 2;

			if (cacheArray[midpoint] === key)
				return midpoint + 1; // index of sucessive value

			if (lowerBound >= upperBound)
				return -1; // not found

			if (key < cacheArray[midpoint])
				upperBound = midpoint - 2;
			else if (key > cacheArray[midpoint])
				lowerBound = midpoint + 2;
		}
	};

// insertion sort, where odd-numbered indices are sorted based on the
// value of the previous even-numbered index, i.e. two indices are
// swapped per iteration of the inner loop
let sort = (cacheArray) => {
		for (let i = 0, l = cacheArray.length, j, k; i < l; i += 2) {
			let key = cacheArray[i],
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
	};

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

	this.get = function(key, options) {
		let value = null;

		if (typeof key !== getDefinedProperty("keyType"))
			return value;

		let index = search(cache, key);

		if (index === -1)
			return value;

		value = cache[index];

		if (options) {
			let optionCount = 0;

			if (options.metadataOnly) {
				let metadata = {};
				++optionCount;

				for (let vKey in value)
					if (vKey !== "data")
						metadata[vKey] = value[vKey];

				return metadata;
			}

			if (options.dataOnly) {
				if (optionCount)
					throw new Error("The \"dataOnly\" and \"metadataOnly\" options are mutually contradictory.");

				value = value.data;
			}
		}

		return value;
	};

	this.has = function(key) {
		let keyType = getDefinedProperty("keyType");

		return (typeof key === keyType && search(cache, key) > -1);
	};

	this.set = function(key, data) {
		let keyType = getDefinedProperty("keyType");

		if (typeof keyType !== STRING_TYPE)
			setDefinedProperty("keyType", (keyType = (typeof key)));

		if (typeof key !== keyType)
			throw new TypeError("Key must be a " + keyType + ".");

		let index = search(cache, key);

		if (index === -1)
			index = cache.length + 1;

		// when capacity is reached, start writing over oldest data
		// use double value to account for consecutive key-value pairs
		if (index >= getDefinedProperty("capacity") * 2)
			index = getDefinedProperty("_oldestIndex");

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

		cache[index - 1] = key;
		cache[index] = object;

		sort(cache);
		return object;
	};

	this.unset = function(key) {
		if (typeof key !== getDefinedProperty("keyType"))
			return false;

		let index = search(cache, key),
			length = cache.length;

		if (index === -1)
			return false;

		if (length > 2) {
			// swap current indices with final two indices in order to pop
			for (let i = 1, temp; i >= 0; --i) {
				temp = cache[index - i];
				cache[index - i] = cache[length - i - 1];
				cache[length - i - 1] = temp;
			}
		}

		for (let i = 0; i < 2; ++i)
			cache.pop();

		return !(sort(cache)); // true
	};

	this.iterate = function(callback, options) {
		let keyType = getDefinedProperty("keyType"),
			boundThis = this,
			curriedGet = (key) => boundThis.get(key, options);

		for (let i = 0, l = cache.length; i < l; i += 2) {
			let key = cache[i];

			if (typeof key !== keyType)
				continue;

			callback(key, curriedGet(key));
		}
	};

	this.clear = () => {
		return !!(cache = []); // true
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
			if (exists.defineProperty) {
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
			return (exists.defineProperty)
				? this[prop]
				: this[getFallbackDefinedPropertyName("get", prop)]();
		},
		setDefinedProperty = (prop, value) => {
			return (exists.defineProperty)
				? (this[prop] = value)
				: this[getFallbackDefinedPropertyName("set", prop)](value);
		};

	/* public getters and setters */

	let privateKeyType = null;

	definePropertyHere("keyType", {
		get: (() => privateKeyType),
		set: (() => {
			let errorMessage = "The only allowable key types are ";

			for (let i = 0, l = ALLOWABLE_KEY_TYPES.length, t; i < l; ++i) {
				t = "\"" + ALLOWABLE_KEY_TYPES[i] + "\"";

				errorMessage += (i < l - 2)
					? t + ", "
					: (i < l - 1)
						? t
						: " and " + t + ".";
			}

			return function(keyType) {
				let isTypeAllowable = (() => {
						for (let i = 0, l = ALLOWABLE_KEY_TYPES.length; i < l; ++i)
							if (keyType === ALLOWABLE_KEY_TYPES[i])
								return true;
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
		get: (() => cache.length / 2)
	});


	let privateCapacity = 0;

	definePropertyHere("capacity", {
		get: (() => privateCapacity),
		set: (capacity) => {
			if (typeof capacity !== NUMBER_TYPE || capacity < 0 || capacity === privateCapacity) {
				return false;
			} else if (capacity < privateCapacity) {
				let difference = privateCapacity - capacity;

				for (let i = 0, l = M.min(this.size, capacity); i < l; i += 2) {
					let index = this._getOldestIndex();
					this.unset(cache[index - 1]);
				}
			}

			let value = (capacity !== NUMBER_TYPE && !isNaN(capacity))
					? parseInt(capacity, 10)
					: capacity;

			value = M.min(value, MAX_CAPACITY);

			if (isNaN(value))
				throw new TypeError("Suggested capacity cannot be parsed.");

			privateCapacity = M.max(value, 0); // disregard negatives;
			return true;
		}
	});

	setDefinedProperty(
		"capacity",
		(options && typeof options.capacity !== UNDEFINED_TYPE)
			? options.capacity
			: MAX_CAPACITY
	);

	/* private getters and setters */

	definePropertyHere("_oldestIndex", {
		get: () => {
			let index = 1,
				updated = N.MAX_VALUE || global.Infinity;

			for (let i = index, l = cache.length; i < l; i += 2) {
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
		for (let key in prototype)
			DataCache.prototype[key] = prototype[key];

})({

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

	map: function(callback, options) {
		this.iterate((key, value) => {
			let newValue = callback(key, value);

			if (!options || !options.dataOnly)
				newValue = newValue.data;

			if (typeof newValue !== UNDEFINED_TYPE)
				this.set(key, newValue);
		}, options);
	},

	filter: function(callback, options) {
		let filteredKeys = [];

		this.iterate((key, value) => {
			if (!callback(key, value))
				filteredKeys.push(key);
		}, options);

		for (let i = 0, l = filteredKeys.length; i < l; ++i)
			this.unset(filteredKeys[i]);
	},

	isFull: function() {
		return (exists.defineProperty)
			? this.size === this.capacity
			: this.getSize() === this.getCapacity();
	},

	isEmpty: function() {
		return ((exists.defineProperty) ? this.size : this.getSize()) === 0;
	},

	// the following function can be used to determine whether to use old-style
	// getters and settters (e.g. this.setCapacity(100)), if it returns false,
	// or new-style (e.g. this.capacity = 100)
	supportsNativeGettersAndSetters: () => {
		return exists.defineProperty;
	}

});

if (IS_NODE) {
	module.exports = DataCache;
} else {
	global.DataCache = DataCache;
}

