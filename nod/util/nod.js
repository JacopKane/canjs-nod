define(function () {
	"use strict";
	var nod = window.nod || {
		Control	: {},
		Model	: {}
	};
	if (typeof GLOBALNOD === 'undefined' || GLOBALNOD !== false) {
		window.nod = nod;
	}
	return nod;
});