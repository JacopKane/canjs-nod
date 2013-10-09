(function (window) {
	'use strict';
	window.define(function () {
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
}) (window);
