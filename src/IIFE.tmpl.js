(function() {

    // return values of typeof function on various types
    // for use in comparisons and conditionals
    const OBJECT_TYPE = "object",
        FUNCTION_TYPE = "function",
        STRING_TYPE = "string",
        NUMBER_TYPE = "number",
        UNDEFINED_TYPE = "undefined";

    ((global, module, process, Error, TypeError, D, M, O, A, N) => {

        "use strict";

		<%= contents %>

	})(
        (typeof this.window === OBJECT_TYPE)
            ? this.window
            : (typeof this.global === OBJECT_TYPE)
                ? this.global
                : this,
        this.module,
		this.process,
        Error,
        TypeError,
        Date,
        Math,
        Object,
        Array,
        Number
    );

})();
