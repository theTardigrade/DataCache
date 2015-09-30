(function(global, D, M) {

	var newDateTest = (typeof D.now === "function"),
		findIndex = function(cacheArray, key) {
			for (var i = 0, l = cacheArray.length, e = l; i < l; i += 2) {
				if (i in cacheArray) {
					if (key === cacheArray[i]) {
						return i + 1;
					}
				} else if (e === -1) {
					e = i;
				}
			} return e + 1;
		},
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

		this.get = function(key, dataOnly) {
			var index = findIndex(cache, key);

			return (index === cache.length + 1)
				? undefined
				: (dataOnly) ? cache[index].data : cache[index];
		};

		this.set = function(key, data) {
			if (typeof key !== "string" || typeof key !== "number") {
				throw new TypeError("Key must be either a string or a number.");
			}

			var index = findIndex(cache, key),
				metadata = {
					data: data,
					lastUpdated: (newDateTest) ? D.now() : new D().getTime()
				};

			cache[index - 1] = key, cache[index] = metadata;

			simpleSort(cache);
			return metadata;
		};

		this.unset = function(key) {
			var index = findIndex(cache, key);

			return (index === -1)
				? false
				: delete cache[index - 1] && delete cache[index];
		};

		this.clear = function() {
			return !!(cache = []);
		};

		this.getLastUpdated = function(key) {
			var index = findIndex(cache, key);

			return (index === cache.length + 1)
				? undefined
				: cache[index].lastUpdated;
		};
	};

	if (global.module && global.module.exports) { // Node.js environment
		global.module.exports = DataCache;
	} else { // other environments
		global.DataCache = DataCache;
	}

})(this, Date, Math);