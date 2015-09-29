(function(global, D) {

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
		};

	function DataCache() {
		var cache = [];

		this.get = function(key, dataOnly) {
			var index = findIndex(cache, key);

			return (index === -1)
				? undefined
				: (dataOnly) ? cache[index].data : cache[index];
		};

		this.set = function(key, data) {
			var index = findIndex(cache, key),
				metadata = {
					data: data,
					lastUpdated: (newDateTest) ? D.now() : new D().getTime()
				};

			if (index === -1) index = cache.length + 1;
			return (cache[index] = metadata) && (cache[index - 1] = key);
		};

		this.remove = function(key) {
			var index = findIndex(cache, key);

			return (index === -1)
				? false
				: delete cache[index - 1] && delete cache[index];
		};

		this.clear = function() {
			return (cache = []) && true;
		};

		this.getLastUpdated = function(key) {
			var index = findIndex(cache, key);

			return (index === -1) ? undefined : cache[index].lastUpdated;
		};
	};

	if (global.module && global.module.exports) {
		global.module.exports = DataCache;
	} else {
		global.DataCache = DataCache;
	}

})(this, Date);