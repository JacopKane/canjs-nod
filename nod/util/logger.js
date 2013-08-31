(function (define, require, window, document, console) {
	'use strict';
	define([
		'can/util/can',
		'nod/util/nod',
		'can/construct',
		'nod/vendor/sugar.string',
		'stacktrace'
	], function (can, nod) {
		nod.Logger = new can.Construct({

		}, {
			object				: false,
			initialized			: false,
			logText				: '\'%s\'->\'%s\'',
			trace				: function () {
				return printStackTrace().slice(4);
			},
			logElements			: function () {
				console.groupCollapsed('Elements');
				can.$.each(this.object.elements, function (k, v) {
					console.log('%s->%o', k, (v.get) ? v.get() : v);
				});
				console.groupEnd();
			},
			logContext			: function () {
				console.groupCollapsed('Context');
				console.log(this.object);
				console.groupEnd();
			},
			logOptions			: function () {
				console.groupCollapsed('Options');
				can.$.each(this.object.options, function (k, v) {
					console.log('%s->%O', k, v);
				});
				console.groupEnd();
			},
			init				: function (object) {
				if (object) {
					this.object = object;
				}
				this.initialized = true;
				return this;
			},
			log					: function () {
				if (!console) {
					return false;
				}
				if (!this.initialized) {
					return false;
				}
				if (!this.object.isDev()) {
					return false;
				}

				if (!window.logs) {
					window.logs = [];
				}
				window.logs.push(arguments);

				var stack	= this.trace().slice(1),
					self	= this;

				console.group(this.logText, this.object.name, stack[0].trim().replace('at ', ''));

				console.group('Log');
				can.$.each(arguments, function (k, v) {
					console.log(v);
				});
				console.groupEnd();

				console.groupCollapsed('Stack');
				can.$.each(stack, function (k, v) {
					console.log('%d: %s->%s', k,  self.object.name, v.trim().replace('at ', ''));
				});
				console.groupEnd();
				console.groupCollapsed('Trace');
				console.trace();
				console.groupEnd();

				if (this.object) {
					this.logElements();
					this.logContext();
					this.logOptions();
				}
				

				console.groupEnd();

				return arguments;
			}
		});

		return nod;
	});
}) (define, require, window, document, console);