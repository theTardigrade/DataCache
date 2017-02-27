/* general constants */


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


/* constructor specific constants */


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

// default amount of milliseconds between each round of automatic garbage collection,
// if set to run
const AUTOMATIC_GARBAGE_COLLECTION_DEFAULT_INTERVAL = 1.5e4, // 15 seconds
	AUTOMATIC_GARBAGE_COLLECTION_MIN_INTERVAL = 5e2, // half a second
	AUTOMATIC_GARBAGE_COLLECTION_MAX_INTERVAL = 1e3 * 60 * 60; // an hour


/* bitmask options for helper functions */


const HELPER_NO_OPTION = 0;

const HELPER_ARRAY_TO_HUMAN_STRING_OPTION_ALTERNATIVES = 1;

const HELPER_ERROR_MAKER_OPTION_PROPERTY = 1,
	HELPER_ERROR_MAKER_OPTION_NEGATED = 2,
	HELPER_ERROR_MAKER_OPTION_ALTERNATIVES = 4,
	HELPER_ERROR_MAKER_OPTION_MORE_THAN = 8,
	HELPER_ERROR_MAKER_OPTION_LESS_THAN = 16,
	HELPER_ERROR_MAKER_OPTION_CONTAIN = 32,
	HELPER_ERROR_MAKER_OPTION_INDEFINITE_ARTICLE = 64;

const HELPER_GET_CURRENT_TIMESTAMP_OPTION_SECONDS = 1;

