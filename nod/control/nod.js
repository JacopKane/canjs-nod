(function (define, require, window, document) {
	'use strict';
	return define([
		'can/util/can',
		'nod/util/nod',
		'nod/util/logger',
		'nod/vendor/sugar.string',
		'can/construct/super',
		'can/control',
		'can/view/mustache'
	], function (can, nod) {
		nod.Control = can.Control({
			newInstance	: function () {
				var inst = this.instance.apply(this, arguments),
					args = arguments;

				if (inst.setup) {
					args = inst.setup.apply(inst, args);
				}
			},
			defaults		: {
				test			: 'test',
				selector		: false,
				namespace		: 'app',
				skipSetup		: {
					checkElement	: false,
					setElements		: false,
					setOptions		: false,
					setFilters		: false,
					namespace		: false,
					render			: false
				},
				path			: {
					base	: '',
					cdn		: ''
				},
				selectors		: {
					window		: can.$(window),
					document	: can.$(document),
					head		: can.$('head'),
					body		: can.$('body')
				},
				render			: {
					style		: {
						extension	: 'less',
						type		: 'less'
					},
					view		: {
						type		: 'mustache',
						extension	: 'mustache',
						insertAs	: 'html'
					}
				}
			}
		}, {
			name			: 'nod',
			parentOptions	: {},
			element			: false,
			selector		: false,
			templates	: {},
			styles		: {},
			namespace	: {
				Control		: {},
				Model		: {},
				instance	: {},
				view		: {},
				style		: {},
				mustache	: {},
				ejs			: {},
				css			: {},
				less		: {}
			},
			global			: true,
			initialized		: false,
			isRendered		: false,
			beforeInit			: function () {
				return this.applyResolve('beforeInit', arguments);
			},
			afterInit			: function () {
				return this.applyResolve('afterInit', arguments);
			},
			beforeRender		: function () {
				return this.applyResolve('beforeRender', arguments);
			},
			afterRender			: function () {
				return this.applyResolve('afterRender', arguments);
			},
			afterStyles			: function () {
				return this.applyResolve('afterStyles', arguments);
			},
			afterTemplates		: function () {
				return this.applyResolve('afterTemplates', arguments);
			},
			afterViews			: function () {
				return this.applyResolve('afterViews', arguments);
			},
			filters				: false,
			data				: {},
			isNod				: function () {
				return this.name === 'nod' ? true : false;
			},
			logger			: { log	: can.$.noop },
			filter			: function (name, args) {
				args = args || [];
				var filter = this.getFilter(name);
				if (!filter) {
					return false;
				}
				if (this.isFilterPending(name)) {
					return this.methodExists(name) ?
						this[name].apply(this, args) : false;
				}
				return false;
			},
			isFilterExists		: function (name) {
				if (this.filters !== null) {
					if (this.filters[name]) {
						if (this.isDeferred(this.filters[name])) {
							return this.filters[name];
						}
					}
				}
			},
			getFilter			: function (name) {
				if (this.isFilterExists(name)) {
					return this.filters[name];
				}

				if (this.setFilters(name) !== false) {
					if (this.isFilterExists(name)) {
						return this.filters[name];
					}
				}
				return false;
			},
			setFilters		: function (filters) {
				if (this.filters === false) {
					this.filters = {};
				}
					
				if (typeof filters === 'string') {
					filters = [filters];
				}
				if (can.$.isArray(filters) === false) {
					return false;
				}

				can.$.each(filters, function (key, value) {
					this.filters[value] = can.$.Deferred();
				}.bind(this));

				return this.filters;
			},
			isDeferred			: function (arg) {
				if (typeof arg === 'object') {
					if (arg !== null) {
						if (typeof arg.promise === 'function') {
							return true;
						}
					}
				}
				return false;
			},
			setup				: function (element, options) {
				var args		= this._super(element, options);
				element		= args[0];
				options		= args[1];

				if (this.options.skipSetup.setOptions !== true) {
					this.options = this.getOptions(options, element);
				}
				if (this.options.skipSetup.setFilters !== true) {
					if (this.options.filters) {
						this.filters = this.setFilters();
					}
				}
				if (this.options.name) {
					this.name = this.options.name;
				}
				if (!this.selector) {
					this.selector = element;
				}
				if (!this.options.selectors[this.name]) {
					this.options.selectors[this.name] = element;
				}
				if (this.options.skipSetup.checkElement !== true) {
					if (!this.element.length) {
						return arguments;
					}
				}
				if (this.options.skipSetup.setElements !== true) {
					this.setElements(this.options.selectors, this.element);
				}
				if (this.name) {
					this.shortName = this.pluginName = this.name;
					if (!this.fullName) {
						this.fullName = this.getFullName();
					}
				}
				if (this.options.skipSetup.namespace !== true) {
					this.getNamespace(this.options.namespace, this.options.global);
				}
				this.shortName = this.name;
				this.fullName = this.getFullName();

				this.logger = new nod.Logger(this);

				args = [this.element, this.options];

				this.pushInstance();
				this.setFlow(this.element, this.options);

				return args;
			},
			init					: function () {
				if (this.getFilter('beforeInit').state() === 'pending') {
					return false;
				}
				return this;
			},
			pushInstance			: function (instance) {
				instance			= instance || this;
				var instanceName	= this.name || false;
				
				if (this.getLoaded(instanceName, 'instance')) {
					instanceName = can.cid(instance, instanceName);
				}
						
				this.getLoadedType('instance')[instanceName] = this;
			},
			getFullName				: function (args) {
				args = can.$.extend({
					name		: this.name,
					delimiter	: '.',
					namespace	: this.options.namespace
				}, args);
				
				return '{namespace}{delimiter}{name}'.assign(args);
			},
			setFlow				: function () {
				return this.filter('beforeInit', arguments)
					.then(function () {
						if (this.init) {
							this.init.apply(this, arguments);
						}
						return this.filter('afterInit', arguments);
					}.bind(this))
					.then(function () {
						this.initialized = true;
						return this.filter('beforeRender', arguments);
					}.bind(this))
					.then(function () {
						if (this.options.skipSetup.render !== true) {
							if (this.isRendered !== true) {
								return this.render();
							}
						}
						return this.applyReject('render', arguments);
					}.bind(this))
					.then(function () {
						this.isRendered = true;
						this.setElements();
						return this.filter('afterRender', arguments);
					}.bind(this));
			},
			isFilterPending		: function (name) {
				var filter = this.getFilter(name);
				if (!filter) {
					return false;
				}
				filter = this.getFilter(name).state() === 'pending' ? true : false;

				if (!filter) {
					this.logger.log('the filter ' + name + ' called multiple times');
				}
				return filter;
			},
			methodExists		: function (name, context) {
				if (!name) {
					return false;
				}
				context = context || this;
				if (typeof context !== 'object') {
					return false;
				}
				return typeof context[name] === 'function' ?
					true : false;
			},
			getPrototype		: function (context) {
				context = context || this;
				if (!context) {
					return false;
				}
				if (Object.getPrototypeOf) {
					return Object.getPrototypeOf(context);
				}
				return false;
			},
			getParent				: function (context) {
				context = context || this;
				return this.getPrototype(this.getPrototype(context));
			},
			getComputedStyle		: function (el) {
				el = el.get(0) || el || false;
				if (!el) {
					return false;
				}
				return el.currentStyle || window.getComputedStyle(el, null);
			},
			heightOfWindow		: function () {
				return can.$(window).height();
			},
			widthOfWindow		: function () {
				return this.elements.window.width();
			},
			getElement			: function (name) {
				if (name === this.name) {
					return this.element;
				}
				if (!this.elements[name]) {
					return false;
				}
				if (!this.elements[name].length) {
					return false;
				}
				return this.elements[name];
			},
			getSelector			: function (name) {
				if (name === this.name) {
					return this.selector;
				}
				if (!this.options.selectors[name]) {
					return false;
				}
				return this.options.selectors[name];
			},
			getWindow			: function () {
				return can.$(this.elements.window);
			},
			getNamespace		: function (namespace, scope) {
				namespace	= namespace || this.options.namespace;
				scope		= scope || window || this;
				if (!namespace) {
					return false;
				}
				if (!scope[namespace]) {
					scope[namespace] = this.namespace;
				}
				return scope[namespace];
			},
			getOptions			: function (options, element) {
				element			= element || this.element;
				var data		= element ? can.data(element) : {},
					cls			= this.constructor;

				options = can.$.extend(true,
					this.options.skipSetup.parentOptions !== true ?
						this.parentOptions : {},
					this.defaults || {},
					cls.defaults || {},
					data || {},
					this.options || {},
					options || {}
				);
				return options;
			},
			newControl				: function (name, options, element) {
				var afterControl	= can.$.Deferred(),
					type			= 'Control';

				if (!name) {
					return this.reject(afterControl, name, options, element);
				}

				element		= element || this.getElement(name);

				options		= can.$.extend(true, {
					name		: name,
					selectors	: {
						parent	: this.element
					}
				}, (options || {}));

				return this.require(name, type, options.namespace)
					.then(function () {
						var Control = this.getLoaded(name, type),
							instance;

						instance		= new Control(element, options);
						return instance.getFilter('afterInit').promise();

					}.bind(this))
					.then(function () {
						return this.applyResolve(afterControl, arguments);
					}.bind(this),
					function () {
						return this.applyReject(afterControl, arguments);
					}.bind(this));
			},
			reject				: function () {
				return this.respond.apply(this, can.$.merge([false], arguments));
			},
			resolve				: function () {
				return this.respond.apply(this, can.$.merge([true], arguments));
			},
			applyResolve				: function (deferred, args) {
				return this.respond.apply(this, can.$.merge([true, deferred], args));
			},
			applyReject					: function (deferred, args) {
				return this.respond.apply(this, can.$.merge([false, deferred], args));
			},
			applyRespond				: function (status, deferred, args) {
				return this.respond.apply(this, can.$.merge([status, deferred], args));
			},
			arraySlice				: function (obj, slice) {
				return Array.prototype.slice.call(obj).slice(slice);
			},
			respond						: function (status, deferred, args) {
				var method, state;

				if (typeof status !== 'boolean') {
					return false;
				}
				if (!deferred) {
					return false;
				}

				if (typeof deferred === 'string') {
					if (this.filters[deferred]) {
						deferred = this.filters[deferred];
					}
				}

				if (!deferred || !deferred.promise) {
					deferred = can.$.Deferred();
				}

				method	= 'rejectWith';
				state	= 'rejected';
				if (status === true) {
					method	= 'resolveWith';
					state	= 'resolved';
				}

				if (deferred.state() !== state) {
					return deferred[method](this, args).promise();
				}

				return deferred.promise();
			},
			renderTemplate			: function (name, viewOptions) {
				var	afterRenderTemplate	= can.$.Deferred(),
					templateName, idName;

				if (!name) {
					return this.reject(afterRenderTemplate, false, name, viewOptions);
				}

				viewOptions		= viewOptions || this.options.render.view;
				name			= this.templates[name] || name;
				templateName	= '{type}-{name}'.assign({
					type	: viewOptions.type,
					name	: name
				}).camelize(false);

				idName		= '#{name}'.assign({
					name : templateName
				});

				if (this.getElement('body').find(idName).length) {
					return this.resolve(afterRenderTemplate, templateName, idName, name);
				}

				this.require({
					type	: viewOptions.type,
					ext		: viewOptions.extension,
					plugin	: 'text',
					name	: name
				})
				.then(function (template) {
					this.getElement('body').append(this.makeTemplate({
						name		: templateName,
						template	: template,
						type		: viewOptions.type
					}));
					return this.resolve(afterRenderTemplate, templateName, idName, name);
				}.bind(this), function () {
					return this.reject(afterRenderTemplate, templateName, idName, name);
				}.bind(this));

				return afterRenderTemplate.promise();
			},
			makeTemplate		: function (options) {
				return '<script type="text/{type}" id="{name}">{template}</script>'.assign(options);
			},
			render				: function () {
				if (!this.templates[this.name]) {
					this.templates[this.name] = this.name;
				}
				if (!this.styles[this.name]) {
					this.styles[this.name] = this.name;
				}

				return this.deferMap(this.styles, function (name) {
					return this.renderStyle(name);
				}.bind(this))
				.then(function () {
					return this.filter('afterStyles', arguments);
				}.bind(this), function () {
					return this.applyReject('afterStyles', arguments);
				}.bind(this))
				.then(function () {
					return this.deferMap(this.templates, function (name) {
						return this.renderTemplate(name);
					}.bind(this))
					.then(function () {
						return this.filter('afterTemplates', [this.templates]);
					}.bind(this), function () {
						return this.applyReject('afterTemplates', arguments);
					}.bind(this));
				}.bind(this))
				.then(function () {
					return this.deferMap(this.templates, function (name) {
						return this.renderView(name);
					}.bind(this));
				}.bind(this))
				.then(function () {
					return this.filter('afterViews', [this.templates]);
				}.bind(this), function () {
					return this.applyReject('afterViews', arguments);
				}.bind(this))
				.then(function () {
					this.setElements(this.elements, this.element);
					return this.applyResolve('render', arguments);
				}.bind(this), function () {
					return this.applyReject('render', arguments);
				}.bind(this));
			},
			deferMap			: function (arrayOrObject, callback) {
				return can.$.when.apply(can.$, can.$.map(arrayOrObject, callback.bind(this)));
			},
			renderView			: function (name, viewOptions, data) {
				viewOptions = can.$.extend(viewOptions, this.options.render.view);

				var afterView	= can.$.Deferred(), element;
				data			= can.$.extend(true, this.data, (data || {}));
				element			= this.getElement(name);

				if (!element) {
					return this.resolve(afterView, name, viewOptions, data, element);
				}
					
				if (!name || !viewOptions) {
					return this.reject(afterView, name, viewOptions, data, element);
				}

				this.require(viewOptions.type, 'view', 'can')
					.then(function () {
						return this.renderTemplate(name);
					}.bind(this), function () {
						return this.reject(afterView, arguments);
					}.bind(this))
					.then(function (templateName, idName, name) {
						if (!element[viewOptions.insertAs]) {
							this.applyReject(afterView, args);
						}

						element = element[viewOptions
							.insertAs](can.view(idName, data));

						var args = [name, templateName, idName, viewOptions, data];
						args = can.$.merge(args, arguments);
						return this.applyResolve(afterView, args);
					}.bind(this),
					function () {
						var args = can.$.merge([name, viewOptions, data], arguments);
						return this.applyReject(afterView, args);
					}.bind(this));

				return afterView.promise();
			},
			getPath				: function (name) {
				return !name ? this.options.path : (this.options.path[name] ?
					this.options.path[name] : '');
			},
			getLoaded			: function (name, type) {
				if (!name) {
					return false;
				}
				if (can.$.inArray(type, ['Control', 'instance']) !== -1) {
					name = name.camelize();
				}

				var loaded = this.getLoadedType(type);
				if (loaded) {
					if (loaded[name]) {
						return loaded[name];
					}
				}
					
				return false;
			},
			getLoadedType		: function (type) {
				return this.getNamespace()[type];
			},
			requirePath			: function (required) {
				if (!required.name) {
					return false;
				}
				if (!required.type) {
					return false;
				}

				required = can.$.extend({
					namespace	: this.options.namespace,
					prefix		: required.plugin ?
						required.plugin + '!' : '',
					extension	: required.ext ?
						'.' + required.ext : ''
				}, required);

				return '{prefix}{namespace}/{type}/{name}{extension}'
					.assign(required)
					.toLocaleLowerCase();
			},
			requireLoad			: function (path) {
				var afterRequireLoad	= can.$.Deferred(),
					requiredPath		= false;

				if (!path) {
					return this.reject(afterRequireLoad, path);
				}
				
				requiredPath = this.isRequired(path);

				if (this.isRequired(requiredPath)) {
					return this.resolve(afterRequireLoad, requiredPath);
				}

				try {
					require([path], function () {
						this.applyResolve(afterRequireLoad, arguments);
					}.bind(this));
				} catch (error) {
					this.reject(afterRequireLoad, false, error);
				}

				return afterRequireLoad.promise();
			},
			require				: function (args) {
				var afterRequire	= can.$.Deferred(),
					path			= false;

				if (arguments.length === 1) {
					if (typeof args === 'object') {
						path = args;
					}
						
					if (typeof args === 'string') {
						path = args;
					}
				}

				if (arguments.length > 1) {
					path = {
						name		: arguments[0],
						type		: arguments[1],
						namespace	: arguments[2] || this.options.namespace,
						extension	: arguments[3],
						plugin		: arguments[4]
					};
				}
					
				if (typeof path === 'object') {
					path = this.requirePath(path);
				}
				
				if (!path) {
					return this.applyReject(afterRequire, arguments);
				}

				this.requireLoad(path)
					.then(function () {
						return this.applyResolve(afterRequire, arguments);
					}.bind(this), function () {
						return this.applyReject(afterRequire, arguments);
					}.bind(this));

				return afterRequire.promise();
			},
			isRequired			: function (path) {
				if (!path) {
					return false;
				}
				var isLoaded = true;

				try {
					isLoaded = require(path);
				} catch (e) {
					isLoaded = false;
				}

				return isLoaded;
			},
			isDev				: function () {
				return this.options.environment === 'development' ?
					true : false;
			},
			loadMethodByType	: function (type, context) {
				context = context || this;
				if (!type) {
					return false;
				}
				var loadMethod	= 'load' + type.capitalize();
				return context[loadMethod] ?
					context[loadMethod].bind(context) : false;
			},
			renderStyle			: function (name, styleOptions) {
				styleOptions = can.$.extend(true, this.options.render.style, styleOptions, {
					name : name
				});

				var afterStyle		= can.$.Deferred(),
					$styleLink		= this.buildStyleLink(styleOptions),
					loadedStyles	= this.getLoadedType(styleOptions.type),
					loadMethod		= this.loadMethodByType(styleOptions.type);

				if (!loadMethod) {
					return this.applyReject(afterStyle, arguments);
				}
					
				if (loadedStyles[name]) {
					return this.applyResolve(afterStyle, arguments);
				}

				if (name && can.$.isfunction(loadMethod) && $styleLink) {
					loadMethod($styleLink, styleOptions)
						.then(function () {
							this.attachToNamespace(this.name, styleOptions.type, arguments[0]);
							return this.applyResolve(afterStyle, arguments);
						}.bind(this), function () {
							return this.reject(afterStyle, name, styleOptions);
						}.bind(this));
				}

				return afterStyle.promise();
			},
			attachToNamespace	: function (name, type, object) {
				this.getLoadedType(type)[name] = object;
			},
			loadCss				: function ($styleLink) {
				var afterCss		= can.$.Deferred();

				if (!$styleLink || !$styleLink.length) {
					return this.applyReject(afterCss, arguments);
				}
				
				$styleLink.load(function () {
					return this.applyResolve(afterCss, arguments);
				}.bind(this));
				this.elements.head.append($styleLink);

				return afterCss.promise();
			},
			loadLess			: function ($styleLink) {
				var afterLess		= can.$.Deferred();
				return this.configureLess()
					.then(function () {
						if (!window.less || !window.less.sheets) {
							return this.applyReject(afterLess, arguments);
						}

						if (this.isDev()) {
							console.groupCollapsed('Loading LESS');
						}

						try {
							window.less.sheets.push($styleLink.get(0));
							window.less.refresh();
						} catch (e) {
							this.logger.log('LESS error', e);
						}

						if (this.isDev()) {
							console.groupEnd();
						}

						return this.applyResolve(afterLess, arguments);
					}.bind(this),
					function () {
						return this.applyReject(afterLess, arguments);
					}.bind(this));
			},
			configureLess		: function () {
				var afterLess = can.$.Deferred();

				window.less = this.options.less;
				return this.require('less')
					.then(function () {
						return this.applyResolve(afterLess, arguments);
					}.bind(this), function () {
						return this.applyReject(afterLess, arguments);
					}.bind(this));
			},
			buildStyleLink		: function (options) {
				options.path		= options.path || '{cdn}{type}/'.assign({
					cdn		: this.getPath('cdn'),
					type	: options.type || false
				});
				options.extension	= options.extension || options.type;
				//<link rel="stylesheet/less" type="text/css" href="styles.less" />
				var styleLink = can.$('<link href="{path}{name}.{extension}" rel="stylesheet/{type}" type="text/{type}" />'
					.assign(options));
				return styleLink;
			},
			setElements			: function () {
				this.elements = this.getElements.apply(this, arguments);
				return this.elements;
			},
			getElements			: function (selectors, scope) {
				selectors = selectors || this.options.selectors || {};
				scope = scope || this.element || can.$(window);

				var elements = {};

				if (this.element) {
					selectors[this.name] = this.element;
				}

				can.$.each(selectors, function (name, selector) {
					if (!selector) {
						return true;
					}
					if (typeof selector === 'string') {
						elements[name] = scope.find(selector);
						return true;
					}
					if (typeof selector === 'object') {
						elements[name] = selector.length ?
							selector : can.$(selector);
						return true;
					}
				}.bind(this));

				return elements;
			},
			checkElement		: function () {
				if (!this.element) {
					return false;
				}
				if (!this.element.length) {
					return false;
				}
				return this.element;
			}
		});

		return nod;
	});
}) (define, require, window, document);