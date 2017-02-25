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

// polyfill for ES6 Array.isArray method
let isArray = (thing) => {
		return (EXISTS.isArray)
			? A.isArray(thing)
			: O.prototype.toString.call(thing) === "[object Array]";
	};

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

// used to generate appropriate constructors
let errorMaker = (thing, predicative, bitmaskOptions, constructor) => {
		let msg = ((bitmaskOptions & ERROR_MAKER_OPT_PROPERTY) ? "Property [" + thing + "]" : thing)
				+ " " + ((bitmaskOptions & ERROR_MAKER_OPT_NEGATED) ? "cannot" : "must")
				+ " be "
				+ ((bitmaskOptions & ERROR_MAKER_OPT_ALTERNATIVES)
					? "one of the following: "
						+ arrayToHumanString(predicative, ARRAY_TO_HUMAN_STRING_OPT_ALTERNATIVES)
					: predicative)
				+ ".",
			isConstructorValid = (typeof constructor === FUNCTION_TYPE
				&& typeof constructor.name === STRING_TYPE
				&& constructor.name.slice(-5) === "Error");

		return new ((isConstructorValid) ? constructor : Error)(msg);
	};

// polyfill of Object.assign
let assignObject = (target, ...sources) => {
		if (EXISTS.assign)
			return O.assign.apply(O, [target].concat(sources));

		if (target == null)
			throw errorMaker(
				"Target object",
				[UNDEFINED_TYPE, "null"],
				ERROR_MAKER_OPT_ALTERNATIVES | ERROR_MAKER_OPT_NEGATED
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

