(function (window) {
    'use strict';
    window.define([
        'nod/util/nod',
        'can/util/library',
        'can/construct',
        'nod/vendor/sugar.string',
        'stacktrace'
    ], function (nod, can) {
        nod.Logger = new can.Construct({}, {
            object              : false,
            initialized         : false,
            logText             : '\'%s\'->\'%s\'',
            trace               : function () {
                return window.printStackTrace().slice(4);
            },
            logElements         : function () {
                window.console.groupCollapsed('Elements');
                can.$.each(this.object.elements, function (k, v) {
                    window.console.log('%s->%o', k, (v.get) ? v.get() : v);
                });
                window.console.groupEnd();
            },
            logContext          : function () {
                window.console.groupCollapsed('Context');
                window.console.log(this.object);
                window.console.groupEnd();
            },
            logOptions          : function () {
                window.console.groupCollapsed('Options');
                can.$.each(this.object.options, function (k, v) {
                    window.console.log('%s->%O', k, v);
                });
                window.console.groupEnd();
            },
            init                : function (object) {
                if (object) {
                    this.object = object;
                }
                this.initialized = true;
                return this;
            },
            log                 : function () {
                if (!console) {
                    return false;
                }
                if (!this.initialized) {
                    return false;
                }
                if (!window.logs) {
                    window.logs = [];
                }
                window.logs.push(arguments);
                if (this.object.isDevelopment) {
                    if (!this.object.isDevelopment()) {
                        return false;
                    }
                }
                var stack   = this.trace().slice(1),
                    self    = this;

                window.console.group(this.logText, this.object.name, stack[0].trim().replace('at ', ''));

                window.console.group('Log');
                can.$.each(arguments, function (k, v) {
                    window.console.log(v);
                });
                window.console.groupEnd();

                window.console.groupCollapsed('Stack');
                can.$.each(stack, function (k, v) {
                    window.console.log('%d: %s->%s', k,  self.object.name, v.trim().replace('at ', ''));
                });
                window.console.groupEnd();
                window.console.groupCollapsed('Trace');
                window.console.trace();
                window.console.groupEnd();

                if (this.object) {
                    this.logElements();
                    this.logContext();
                    this.logOptions();
                }


                window.console.groupEnd();

                return arguments;
            }
        });
        return nod;
    });
}) (window);
