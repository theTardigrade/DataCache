// binary search, considering only even-numbered indices
// to account for the fact that in the array used to hold cache data
// odd-numbered indices contain keys and the successive odd-numbered
// index contains a corresponding value
let helper_search = (cacheArray, key) => {
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
let helper_sort = (cacheArray) => {
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

// recursively freeze an object, to make it and all of its subobjects
// immutable (i.e. read-only)
let helper_deepFreeze = (object) => {
		for (let key in object)
			if (typeof object === OBJECT_TYPE)
				helper_deepFreeze(object[key]);

		O.freeze(object);
	};

// polyfill of Array.isArray
let helper_isArray = (() => {
		let nativeKey = "isArray";

		if (EXISTS[nativeKey])
			return A[nativeKey];

		return (thing) => {
			 O.prototype.toString.call(thing) === "[object Array]";
		};
	})();

// return the contents of an array in English human-readable form
let helper_arrayToHumanString = (array, bitmaskOptions) => {
		let str = "";

		if (helper_isArray(array)) {
			for (let i = 0, l = array.length, tmp; i < l; ++i) {
				tmp = "\"" + array[i].toString() + "\"";
				str += (i < l - 2)
					? tmp + ", "
					: (i < l - 1)
						? tmp
						: " "
							+ ((bitmaskOptions & HELPER_ARRAY_TO_HUMAN_STRING_OPTION_ALTERNATIVES)
								? "or"
								: "and")
							+ " " + tmp;
			}
		}

		return str;
	};

// used to generate appropriate error instances and messages
let helper_errorMaker = (thing, predicative, bitmaskOptions, ConstructorFunc) => {
		let msg = ((bitmaskOptions & HELPER_ERROR_MAKER_OPTION_PROPERTY) ? "Property [" + thing + "]" : thing)
				+ " " + ((bitmaskOptions & HELPER_ERROR_MAKER_OPTION_NEGATED) ? "cannot" : "must")
				+ " " + ((bitmaskOptions & HELPER_ERROR_MAKER_OPTION_CONTAIN) ? "contain" : "be")
				+ " " + ((bitmaskOptions & HELPER_ERROR_MAKER_OPTION_MORE_THAN) ? "more" : "")
				+ ((bitmaskOptions & HELPER_ERROR_MAKER_OPTION_LESS_THAN) ? "less" : "")
				+ ((bitmaskOptions & HELPER_ERROR_MAKER_OPTION_MORE_THAN || bitmaskOptions & HELPER_ERROR_MAKER_OPTION_LESS_THAN)
					? " than "
					: "")
				+ ((bitmaskOptions & HELPER_ERROR_MAKER_OPTION_INDEFINITE_ARTICLE) ? "a " : "")
				+ ((bitmaskOptions & HELPER_ERROR_MAKER_OPTION_ALTERNATIVES)
					? "one of the following: "
						+ helper_arrayToHumanString(predicative, HELPER_ARRAY_TO_HUMAN_STRING_OPTION_ALTERNATIVES)
					: predicative)
				+ ((bitmaskOptions & HELPER_ERROR_MAKER_OPTION_UNIT_MILLISECONDS) ? " of milliseconds" : "")
				+ ".",
			isConstructorValid = (typeof ConstructorFunc === FUNCTION_TYPE
				&& typeof ConstructorFunc.name === STRING_TYPE
				&& ConstructorFunc.name.slice(-5) === "Error");

		return new ((isConstructorValid) ? ConstructorFunc : Error)(msg);
	};

// curry function in order to produce an erroMaker function
// that is pre-prepared for use with a specific property
let helper_getPropertyErrorMaker = (propertyName) => {
		return (predicative, bitmaskOptions, ConstructorFunc) => {
			return helper_errorMaker(
				propertyName,
				predicative,
				HELPER_ERROR_MAKER_OPTION_PROPERTY | bitmaskOptions,
				ConstructorFunc
			);
		};
	};

// polyfill of Object.assign
let helper_assignObject = (() => {
		let nativeKey = "assign";

		if (EXISTS[nativeKey])
			return O[nativeKey];

		return function(target) {
			if (target == null)
				throw helper_errorMaker(
					"Target object",
					[UNDEFINED_TYPE, NULL_NAME],
					HELPER_ERROR_MAKER_OPTION_ALTERNATIVES | HELPER_ERROR_MAKER_OPTION_NEGATED,
					TypeError
				);

			let t = O(target);

			for (let i = 1, l = arguments.length, source; i < l; ++i) {
				if ((source = arguments[i]) == null)
					continue;

				for (let key in source)
					if (O.prototype.hasOwnProperty.call(s, key))
						t[key] = s[key];
			}

			return t;
		};
	})();

// polyfill of Date.now
let helper_getCurrentTimestamp = (() => {
		let nativeKey = "now";

		if (EXISTS[nativeKey])
			return D[nativeKey];

		return () => {
			return new D().getTime();
		};
	})();
