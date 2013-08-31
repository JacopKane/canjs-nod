(function (window, document, define) {
	'use strict';
	return define(function () {
		var nod = window.nod || {
			control	: {},
			model	: {}
		};
		if (typeof window.GLOBALNOD !== 'undefined') {
			if (window.GLOBALNOD === false) {
				return nod;
			}
		}
		window.nod = nod;
		return window.nod;
	});
}) (window, document, define);