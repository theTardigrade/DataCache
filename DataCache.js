(function(global, D, M) {

	var newDateTest = (typeof D.now === "function"),
		findIndex = function(cacheArray, key) {
			for (var i = 0, e = -1; i < cacheArray.length; i += 2) {
				if (i in cacheArray) {
					if (key === cacheArray[i]) {
						return i + 1;
					}
				} else if (e === -1) {
					e = i + 1;
				}
			} return e;
		},
		simpleArraySort = function(array) {
			for (var i = 0, j, temp; i < array.length; i += 2) {
				if (array[i] > array[i + 2]) {
					for (j = i; j < i + 2; j++) {
						temp = array[j];
						array[j] = array[j + 2], array[j + 2] = temp;
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

			return (index === -1)
				? undefined
				: (dataOnly) ? cache[index].data : cache[index];
		};

		this.set = function(key, data) {
			if (typeof key === "undefined") {
				throw new TypeError("Key cannot be undefined.");
			}

			var index = findIndex(cache, key),
				metadata = {
					data: data,
					lastUpdated: (newDateTest) ? D.now() : new D().getTime()
				};

			if (index === -1) index = cache.length + 1;
			(cache[index - 1] = key) && (cache[index] = metadata);

			simpleArraySort(cache);
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

			return (index === -1) ? undefined : cache[index].lastUpdated;
		};
	};

	if (global.module && global.module.exports) { // Node.js environment
		global.module.exports = DataCache;
	} else { // other environments
		global.DataCache = DataCache;
	}

})(this, Date, Math);