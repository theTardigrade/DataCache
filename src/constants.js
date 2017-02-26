// return values of typeof function on various types
// for use in comparisons and conditionals
const OBJECT_TYPE = "object",
	FUNCTION_TYPE = "function",
	STRING_TYPE = "string",
	NUMBER_TYPE = "number",
	UNDEFINED_TYPE = "undefined";

const NULL_NAME = "null";

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

/* bitmask options for helper functions */

const NO_OPT = 0;

const ARRAY_TO_HUMAN_STRING_OPT_ALTERNATIVES = 1;

const ERROR_MAKER_OPT_PROPERTY = 1,
    ERROR_MAKER_OPT_NEGATED = 2,
    ERROR_MAKER_OPT_ALTERNATIVES = 4,
	ERROR_MAKER_OPT_ONE_MAX = 8,
	ERROR_MAKER_OPT_CONTAIN = 16;

