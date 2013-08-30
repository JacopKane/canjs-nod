(function (window, document, define, GLOBALNOD) {
	'use strict';
	return define(function () {
		var nod = window.nod || {
			control	: {},
			model	: {}
		};
		if (typeof GLOBALNOD === 'undefined') {
			return nod;
		}
		if (GLOBALNOD === false) {
			return nod;
		}
		window.nod = nod;
		return nod;
	});
}) (window, document, define, GLOBALNOD);