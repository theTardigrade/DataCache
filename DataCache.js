(function(global, D, M) {

	const ENVIRONMENT = (global.module && global.module.exports)
			? "Node.js"
			: undefined;

//	var $ = (ENVIRONMENT) ? require("jquery") : global.jQuery||global.Zepto;

	var newDateTest = (typeof D.now === "function"),
		simpleSearch = function(cacheArray, key) {
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
		simpleSort = function(cacheArray) {
			for (var i = 0, j, temp; i < cacheArray.length; i += 2) {
				if (cacheArray[i] > cacheArray[i + 2]) {
					for (j = i; j < i + 2; j++) {
						temp = cacheArray[j];
						cacheArray[j] = cacheArray[j + 2];
						cacheArray[j + 2] = temp;
					} i -= 4;
				}
			}
		}; // uses an implementation of gnome sort

	function DataCache(size) {
		var cacheSize = (function() {
				var r = (typeof size !== "number") ? parseInt(size, 10) : size;
				r = M.min(r, M.pow(2, 32) - 1); // maximum array length (4.29bn)
				return M.max(r, 0); // disregard negatives
			})(),
			cache = (global.isNaN(cacheSize)) ? [] : new Array(cacheSize);

		/* public functions */

		this.get = function(key, dataOnly) {
			var index = simpleSearch(cache, key);

			return (index === -1)
				? undefined
				: (dataOnly) ? cache[index].data : cache[index];
		};

		this.set = function(key, data) {
			if (typeof key !== "string" && typeof key !== "number") {
				throw new TypeError("Key must be either a string or a number.");
			}

			// if data is an object, array inclusive,
			// deep copy rather than saving reference
			var dataClone = (typeof data === "object")
				? global.JSON.parse(global.JSON.stringify(data))
				: data;

			var index = simpleSearch(cache, key);
			if (index === -1) index = cache.length + 1;
			
			var metadata = {
					data: dataClone,
					lastUpdated: (newDateTest) ? D.now() : new D().getTime()
				};

			metadata.created = (cache[index] && cache[index].created)
				? cache[index].created
				: metadata.lastUpdated;

			cache[index - 1] = key, cache[index] = metadata;
			simpleSort(cache);
			return metadata;
		};

		this.unset = function(key) {
			var index = simpleSearch(cache, key),
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
			simpleSort(cache);
			return true;
		};

		this.clear = function() {
			return !!(cache = []);
		};

		this.getLastUpdated = function(key) {
			var index = simpleSearch(cache, key);

			return (index === -1)
				? undefined
				: cache[index].lastUpdated;
		};
	};

	if (ENVIRONMENT) { // Node.js environment
		global.module.exports = DataCache;
	} else { // other environments
		global.DataCache = DataCache;
	}

})(this, Date, Math);