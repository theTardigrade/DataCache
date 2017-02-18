(function() {

    // return values of typeof function on various types
    // for use in comparisons and conditionals
    const OBJECT_TYPE = "object",
        FUNCTION_TYPE = "function",
        STRING_TYPE = "string",
        NUMBER_TYPE = "number",
        UNDEFINED_TYPE = "undefined";

    ((global, module, Error, TypeError, D, M, O, N) => {

        "use strict";

		<%= contents %>

	})(
        (typeof window === OBJECT_TYPE)
            ? window
            : (typeof global === OBJECT_TYPE)
                ? global
                : this,
        this.module,
        Error,
        TypeError,
        Date,
        Math,
        Object,
        Number
    );

})();
