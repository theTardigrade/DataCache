
((global, module, define, Error, TypeError, RangeError, isNaN, D, M, O, A, N) => {

	"use strict";

	<%= contents %>

})(
	(this.window != null)
		? this.window
		: (this.global != null)
			? this.global
			: this,
	this.module,
	this.define,
	Error,
	TypeError,
	RangeError,
	isNaN,
	Date,
	Math,
	Object,
	Array,
	Number
);

