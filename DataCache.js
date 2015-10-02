(function(global, D, M) {

	// boolean below set to true if, and only if, code is running in Node.js
	const IS_NODE = !!(global.process && global.module && global.module.exports
		&& (typeof global.require === "function"));

//	var $ = (IS_NODE) ? require("jquery") : global.jQuery || global.Zepto;

	var isNow = (typeof D.now === "function"),
		keyTypeTest = function(key) {
			if (typeof key !== "string") {
				throw new TypeError("Key must be a string.");
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
			var key, value;
			for (var i = 0, l = cacheArray.length, j, k; i < l; i += 2) {
				key = cacheArray[i];
				value = cacheArray[i + 1];

				for (j = i - 2; j > -1 && cacheArray[j] > key; j -= 2) {
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

	function DataCache(size) {
		var cacheSize = (function() {
				var r = (typeof size !== "number") ? parseInt(size, 10) : size;
				r = M.min(r, M.pow(2, 32) - 1); // maximum array length (4.29bn)
				return M.max(r, 0); // disregard negatives
			})(),
			cache = this._debugCache = (global.isNaN(cacheSize)) ? [] : new Array(cacheSize);

		/* public functions */

		this.get = function(key, dataOnly) {
			keyTypeTest(key);

			var index = search(cache, key);

			return (index === -1)
				? undefined
				: (dataOnly) ? cache[index].data : cache[index];
		};

		this.set = function(key, data) {
			keyTypeTest(key);

			var index = search(cache, key);
			if (index === -1) index = cache.length + 1;

			// if data is an object, array inclusive,
			// deep copy rather than saving reference
			var dataClone = (typeof data === "object")
				? global.JSON.parse(global.JSON.stringify(data))
				: data;
			
			var metadata = {
					data: dataClone,
					lastUpdated: (isNow) ? D.now() : new D().getTime()
				};

			metadata.created = (cache[index] && cache[index].created)
				? cache[index].created
				: metadata.lastUpdated;

			cache[index - 1] = key, cache[index] = metadata;
			sort(cache);
			return metadata;
		};

		this.unset = function(key) {
			var index = search(cache, key),
				length = cache.length;

			if (index === -1) return false;

			if (length > 2) {
				// swap current indices with final two indices in order to pop
				for (var i = 1, temp; i >= 0; i--) {
					temp = cache[index - i];
					cache[index - i] = cache[length - i - 1];
					cache[length - i - 1] = temp;
				}
			}

			for (i = 0; i < 2; i++) cache.pop();
			sort(cache);
			return true;
		};

		this.clear = function() {
			return !!(cache = []);
		};

		this.getLastUpdated = function(key) {
			var index = search(cache, key);

			return (index === -1)
				? undefined
				: cache[index].lastUpdated;
		};
	};

	if (IS_NODE) {
		global.module.exports = DataCache;
	} else {
		global.DataCache = DataCache;
	}

})(this, Date, Math);