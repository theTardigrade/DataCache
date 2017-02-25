// object where keys are names of properties defined on global objects
// and values are booleans showing whether they're available or not
const EXISTS = ((data) => {
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
		{ key: "now", object: D },
		{ key: "includes", object: A.prototype },
		{ key: "isArray", object: A }
	]);

// cache key can be set to accept one of the following types
const ALLOWABLE_KEY_TYPES = [
		STRING_TYPE,
		NUMBER_TYPE
	];

if (!EXISTS.includes) {
	let includes = function(predicative) {
			for (let i = 0, l = this.length; i < l; ++i)
				if (predicative === this[i])
					return true;
			return false;
		};

	ALLOWABLE_KEY_TYPES.includes = includes;
}

// used to ensure that underlying array does not exceed maximum allowed (i.e. 4.29bn)
const MAX_ARRAY_LENGTH = ((1 << 16) * (1 << 16)) - 1,
	MAX_CAPACITY = M.floor(MAX_ARRAY_LENGTH / 2);
