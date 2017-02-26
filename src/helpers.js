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

// recursively freeze an object, to make it and all of its subobjects
// immutable (i.e. read-only)
let deepFreeze = (object) => {
		for (let key in object)
			if (typeof object === OBJECT_TYPE)
				deepFreeze(object[key]);

		O.freeze(object);
	};

// polyfill of Array.isArray
let isArray = (() => {
		let nativeKey = "isArray";

		if (EXISTS[nativeKey])
			return A[nativeKey];

		return (thing) => {
			 O.prototype.toString.call(thing) === "[object Array]";
		};
	})();

// return the contents of an array in English human-readable form
let arrayToHumanString = (array, bitmaskOptions) => {
		let str = "";

		if (isArray(array)) {
			for (let i = 0, l = array.length, tmp; i < l; ++i) {
				tmp = "\"" + array[i].toString() + "\"";
				str += (i < l - 2)
					? tmp + ", "
					: (i < l - 1)
						? tmp
						: " " + ((bitmaskOptions & ARRAY_TO_HUMAN_STRING_OPT_ALTERNATIVES) ? "or" : "and") + " " + tmp;
			}
		}

		return str;
	};

// used to generate appropriate error instances and messages
let errorMaker = (thing, predicative, bitmaskOptions, ConstructorFunc) => {
		let msg = ((bitmaskOptions & ERROR_MAKER_OPT_PROPERTY) ? "Property [" + thing + "]" : thing)
				+ " " + ((bitmaskOptions & ERROR_MAKER_OPT_NEGATED) ? "cannot" : "must")
				+ " " + ((bitmaskOptions & ERROR_MAKER_OPT_CONTAIN) ? "contain" : "be")
				+ " " +((bitmaskOptions & ERROR_MAKER_OPT_ONE_MAX) ? "more than " : "")
				+ ((bitmaskOptions & ERROR_MAKER_OPT_ALTERNATIVES)
					? "one of the following: "
						+ arrayToHumanString(predicative, ARRAY_TO_HUMAN_STRING_OPT_ALTERNATIVES)
					: predicative)
				+ ".",
			isConstructorValid = (typeof ConstructorFunc === FUNCTION_TYPE
				&& typeof ConstructorFunc.name === STRING_TYPE
				&& ConstructorFunc.name.slice(-5) === "Error");

		return new ((isConstructorValid) ? ConstructorFunc : Error)(msg);
	};

// polyfill of Object.assign
let assignObject = (() => {
		let nativeKey = "assign";

		if (EXISTS[nativeKey])
			return O[nativeKey];

		return (target, ...sources) => {
			if (target == null)
				throw errorMaker(
					"Target object",
					[UNDEFINED_TYPE, NULL_NAME],
					ERROR_MAKER_OPT_ALTERNATIVES | ERROR_MAKER_OPT_NEGATED,
					TypeError
				);

			let t = O(target);

			for (let i = 0, l = sources.length, s; i < l; ++i) {
				if ((s = sources[i]) == null)
					continue;

				for (let key in s)
					if (O.prototype.hasOwnProperty.call(s, key))
						t[key] = s[key];
			}

			return t;
		};
	})();

let getCurrentTimestamp = (() => {
		let nativeKey = "now",
			nativeKeyExists = EXISTS[nativeKey];

		return (bitmaskOptions) => {
			let timestamp = ((nativeKeyExists) ? D[nativeKey] : new D().getTime)();

			return (bitmaskOptions & GET_CURRENT_TIMESTAMP_OPT_SECONDS)
				? M.round(timestamp / 1e3)
				: timestamp;
		};
	})();
