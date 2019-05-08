/*!
  * vue-router v0.1.16
  * (c) 2019 Evan You
  * @license MIT
  */
function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var sprintf = createCommonjsModule(function (module, exports) {
/* global window, exports, define */

!function() {

    var re = {
        not_string: /[^s]/,
        not_bool: /[^t]/,
        not_type: /[^T]/,
        not_primitive: /[^v]/,
        number: /[diefg]/,
        numeric_arg: /[bcdiefguxX]/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[+-]/
    };

    function sprintf(key) {
        // `arguments` is not an array, but should be fine for this call
        return sprintf_format(sprintf_parse(key), arguments)
    }

    function vsprintf(fmt, argv) {
        return sprintf.apply(null, [fmt].concat(argv || []))
    }

    function sprintf_format(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, arg, output = '', i, k, ph, pad, pad_character, pad_length, is_positive, sign;
        for (i = 0; i < tree_length; i++) {
            if (typeof parse_tree[i] === 'string') {
                output += parse_tree[i];
            }
            else if (typeof parse_tree[i] === 'object') {
                ph = parse_tree[i]; // convenience purposes only
                if (ph.keys) { // keyword argument
                    arg = argv[cursor];
                    for (k = 0; k < ph.keys.length; k++) {
                        if (arg == undefined) {
                            throw new Error(sprintf('[sprintf] Cannot access property "%s" of undefined value "%s"', ph.keys[k], ph.keys[k-1]))
                        }
                        arg = arg[ph.keys[k]];
                    }
                }
                else if (ph.param_no) { // positional argument (explicit)
                    arg = argv[ph.param_no];
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++];
                }

                if (re.not_type.test(ph.type) && re.not_primitive.test(ph.type) && arg instanceof Function) {
                    arg = arg();
                }

                if (re.numeric_arg.test(ph.type) && (typeof arg !== 'number' && isNaN(arg))) {
                    throw new TypeError(sprintf('[sprintf] expecting number but found %T', arg))
                }

                if (re.number.test(ph.type)) {
                    is_positive = arg >= 0;
                }

                switch (ph.type) {
                    case 'b':
                        arg = parseInt(arg, 10).toString(2);
                        break
                    case 'c':
                        arg = String.fromCharCode(parseInt(arg, 10));
                        break
                    case 'd':
                    case 'i':
                        arg = parseInt(arg, 10);
                        break
                    case 'j':
                        arg = JSON.stringify(arg, null, ph.width ? parseInt(ph.width) : 0);
                        break
                    case 'e':
                        arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential();
                        break
                    case 'f':
                        arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg);
                        break
                    case 'g':
                        arg = ph.precision ? String(Number(arg.toPrecision(ph.precision))) : parseFloat(arg);
                        break
                    case 'o':
                        arg = (parseInt(arg, 10) >>> 0).toString(8);
                        break
                    case 's':
                        arg = String(arg);
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break
                    case 't':
                        arg = String(!!arg);
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break
                    case 'T':
                        arg = Object.prototype.toString.call(arg).slice(8, -1).toLowerCase();
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break
                    case 'u':
                        arg = parseInt(arg, 10) >>> 0;
                        break
                    case 'v':
                        arg = arg.valueOf();
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break
                    case 'x':
                        arg = (parseInt(arg, 10) >>> 0).toString(16);
                        break
                    case 'X':
                        arg = (parseInt(arg, 10) >>> 0).toString(16).toUpperCase();
                        break
                }
                if (re.json.test(ph.type)) {
                    output += arg;
                }
                else {
                    if (re.number.test(ph.type) && (!is_positive || ph.sign)) {
                        sign = is_positive ? '+' : '-';
                        arg = arg.toString().replace(re.sign, '');
                    }
                    else {
                        sign = '';
                    }
                    pad_character = ph.pad_char ? ph.pad_char === '0' ? '0' : ph.pad_char.charAt(1) : ' ';
                    pad_length = ph.width - (sign + arg).length;
                    pad = ph.width ? (pad_length > 0 ? pad_character.repeat(pad_length) : '') : '';
                    output += ph.align ? sign + arg + pad : (pad_character === '0' ? sign + pad + arg : pad + sign + arg);
                }
            }
        }
        return output
    }

    var sprintf_cache = Object.create(null);

    function sprintf_parse(fmt) {
        if (sprintf_cache[fmt]) {
            return sprintf_cache[fmt]
        }

        var _fmt = fmt, match, parse_tree = [], arg_names = 0;
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree.push(match[0]);
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree.push('%');
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1;
                    var field_list = [], replacement_field = match[2], field_match = [];
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list.push(field_match[1]);
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1]);
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1]);
                            }
                            else {
                                throw new SyntaxError('[sprintf] failed to parse named argument key')
                            }
                        }
                    }
                    else {
                        throw new SyntaxError('[sprintf] failed to parse named argument key')
                    }
                    match[2] = field_list;
                }
                else {
                    arg_names |= 2;
                }
                if (arg_names === 3) {
                    throw new Error('[sprintf] mixing positional and named placeholders is not (yet) supported')
                }

                parse_tree.push(
                    {
                        placeholder: match[0],
                        param_no:    match[1],
                        keys:        match[2],
                        sign:        match[3],
                        pad_char:    match[4],
                        align:       match[5],
                        width:       match[6],
                        precision:   match[7],
                        type:        match[8]
                    }
                );
            }
            else {
                throw new SyntaxError('[sprintf] unexpected placeholder')
            }
            _fmt = _fmt.substring(match[0].length);
        }
        return sprintf_cache[fmt] = parse_tree
    }

    /**
     * export to either browser or node.js
     */
    /* eslint-disable quote-props */
    {
        exports['sprintf'] = sprintf;
        exports['vsprintf'] = vsprintf;
    }
    if (typeof window !== 'undefined') {
        window['sprintf'] = sprintf;
        window['vsprintf'] = vsprintf;

        if (typeof undefined === 'function' && undefined['amd']) {
            undefined(function() {
                return {
                    'sprintf': sprintf,
                    'vsprintf': vsprintf
                }
            });
        }
    }
    /* eslint-enable quote-props */
}(); // eslint-disable-line
});

var LocaleStatus = {
	default: Symbol(),
	ready: Symbol(),
};

var locale = /*@__PURE__*/(function () {
	function Locale(locale, data) {
		this.locale = locale;
		this.plural = [];
		this.translations = {};
		this.status = LocaleStatus.default;

		if (data) {
			this.setup(data);
		}
	}

	var prototypeAccessors = { isReady: { configurable: true } };

	Locale.prototype.setup = function setup (data) {
		this.plural = data.plural || [1, null];
		this.translations = data.translations || {};
		this.status = LocaleStatus.ready;
	};

	prototypeAccessors.isReady.get = function () {
		return this.status === LocaleStatus.ready;
	};

	Locale.prototype.getTranslation = function getTranslation (key, useKeys) {
		if ( useKeys === void 0 ) useKeys = false;

		if (!useKeys) {
			return this.translations[key];
		}

		var parts = key.split('.');
		
		var part;
		var translation = this.translations;
		while (translation && (part = parts.shift())) {
			translation = translation[part];
		}
		
		return translation;
	};

	Locale.prototype.getTranslationVariant = function getTranslationVariant (translation, count) {
		var variant = -1;
		
		for (var i = 0; i < this.plural.length; i++) {
			// set default variant if there is no existing one
			if (translation[i]) {
				variant = i;
			}

			if (typeof this.plural[i] === 'number' && count === this.plural[i]) {
				variant = i;
				break;
			} else if (Array.isArray(this.plural[i]) && this.plural[i].indexOf(count) !== -1) {
				variant = i;
				break;
			} else if (this.plural[i] === null) {
				variant = i;
			}
		}
		
		return translation[variant];
	};

	Object.defineProperties( Locale.prototype, prototypeAccessors );

	return Locale;
}());

var setLocale = function(i18n, name) {
	var this$1 = this;

	if (!i18n.hasLocale(name)) {
		throw new Error('Language not available.');
	}

	if (!this.locale) {
		this.locale = name;
	}

	var locale = i18n.getLocale(name);

	if (locale.isReady) {
		this.locale = name;
		this === i18n && this.emit('update');
		return Promise.resolve();
	}

	if (locale.loadPromise) {
		return locale.loadPromise.then(function () {
			this$1.locale = name;
			this$1 === i18n && this$1.emit('update');
		});
	}

	if (!i18n.driver) {
		throw new Error('No language driver provided.');
	}

	locale.loadPromise = i18n.driver.load(name, i18n.namespace);

	return locale.loadPromise.then(function () {
		this$1.locale = name;
		this$1 === i18n && this$1.emit('update');
	});
};

var translate = function(i18n, text) {
	var args = [], len = arguments.length - 2;
	while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];

	if (typeof text === 'object') {
		text.locale = text.locale || this.locale;
	} else {
		text = {
			text: text,
			locale: this.locale,
		};
	}

	return i18n.translate.apply(i18n, [ text ].concat( args ));
};

var prepare = function(i18n, locale) {
	return i18n.prepare(locale || this.locale);
};

var api = {
	setLocale: setLocale,
	translate: translate,
	prepare: prepare
};

var vsprintf = sprintf.vsprintf;



var I18nSymbol = Symbol();

var lango = /*@__PURE__*/(function () {
	function Lango(options) {
	if ( options === void 0 ) options = {};

		this.configure(options);
	}

	var prototypeAccessors = { localeData: { configurable: true } };

	prototypeAccessors.localeData.get = function () {
		return this.locales[this.locale];
	};

	/**
	 * Configure i18n
	 * @param {Object} options
	 */
	Lango.prototype.configure = function configure (options) {
		var this$1 = this;
		if ( options === void 0 ) options = {};

		this.locales = {};

		this.fallbacks = options.fallbacks || {};
		this.namespace = options.namespace || null;

		this.driver = options.driver || null;

		this.useKeys = typeof options.useKeys === 'boolean' ? options.useKeys : true;
		this.api = {
			__: 'translate',
			translate: 'translate',
			hasLocale: 'hasLocale',
			getLocale: 'getLocale',
			setLocale: 'setLocale',
			removeLocale: 'removeLocale',
			getLocales: 'getLocales',
			prepareLocale: 'prepare',
		};

		this.listeners = {};
		
		var locales = options.locales || [];
		var data = options.data || {};

		locales.forEach(function (locale$$1) {
			this$1.addLocale(locale$$1, data[locale$$1]);
		});

		this.defaultLocale = options.defaultLocale || Object.keys(this.locales)[0];

		this.setLocale = api.setLocale.bind(this, this);

		var locale$$1 = options.locale || this.defaultLocale;
		if (locale$$1) {
			this.setLocale(locale$$1);
		}
	};

	// Events

	/**
	 * Add event listener
	 * @param {String} event 
	 * @param {Function} handler 
	 */
	Lango.prototype.on = function on (event, handler) {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}

		this.listeners[event].push(handler);
	};
	
	/**
	 * Remove event listener
	 * @param {String} event 
	 * @param {Function} handler 
	 */
	Lango.prototype.off = function off (event, handler) {
		var listeners = this.listeners[event];

		if (!listeners) {
			return;
		}

		var index = listeners.indexOf(handler);
		index !== -1 && listeners.splice(index, 1);
	};

	/**
	 * Emit event
	 * @param {String} event 
	 */
	Lango.prototype.emit = function emit (event) {
		var listeners = this.listeners[event];

		if (!listeners) {
			return;
		}

		var args = Array.prototype.slice.call(arguments, 1);

		for (var i = 0; i < this.listeners.length; i++) {
			this.listeners[i].apply(args);
		}
	};
	
	// Locales
	Lango.prototype.getLocales = function getLocales () {
		return Object.keys(this.locales);
	};
	
	Lango.prototype.hasLocale = function hasLocale (locale$$1) {
		return this.locales.hasOwnProperty(locale$$1);
	};
	
	Lango.prototype.addLocale = function addLocale (locale$$1, data) {
		if (this.locales[locale$$1]) {
			throw new Error('Language already added.');
		}
		
		this.locales[locale$$1] = new locale(locale$$1, data);

		if (!this.defaultLocale) {
			this.defaultLocale = locale$$1;
		}
	};
	
	Lango.prototype.removeLocale = function removeLocale (locale$$1) {
		if (!this.locales[locale$$1]) {
			throw new Error('Language not available.');
		}

		delete this.locales[locale$$1];
	};

	Lango.prototype.getLocale = function getLocale (locale$$1) {
		return this.locales[locale$$1];
	};

	Lango.prototype.getFallbackLocale = function getFallbackLocale (locale$$1) {
		return this.fallbacks[locale$$1] || this.defaultLocale;
	};
	
	Lango.prototype.prepare = function prepare (locale$$1) {
		var localeData = this.getLocale(locale$$1 || this.locale);

		return localeData && localeData.loadPromise ? localeData.loadPromise : Promise.resolve();
	};

	// Translation

	Lango.prototype.parseValues = function parseValues (args) {
		var namedValues = {};
		var values = [];

		if (args.length < 2) {
			return {namedValues: namedValues, values: values};
		}

		var lastArg = args[args.length-1];
		var valuesLength = args.length;
		if (lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg)) {
			namedValues = lastArg;
			valuesLength -= 1;
		}

		Array.prototype.slice.call(args, 1, valuesLength).forEach(function (value) {
			values.push.apply(values, Array.isArray(value) ? value : [value]);
		});

		return {namedValues: namedValues, values: values};
	};
	
	Lango.prototype.translate = function translate (text, count) {
		var key;
		var locale$$1 = this.locale;

		// parse values
		var ref = this.parseValues(arguments);
		var namedValues = ref.namedValues;
		var values = ref.values;

		// normalize params
		if (typeof text === 'object') {
			key = text.text;

			if (text.locale) {
				if (!this.hasLocale(text.locale)) {
					throw new Error('Invalid locale.');
				}

				locale$$1 = text.locale;
			}
		} else if (typeof text === 'string') {
			key = text;
		} else {
			throw new Error('Invalid key to translate.');
		}

		text = key;

		var localeData = this.getLocale(locale$$1);

		var isTranslated = false;
		var translation = localeData.getTranslation(text, this.useKeys);

		if (!translation) {
			localeData = this.getLocale(this.getFallbackLocale(locale$$1));

			if (localeData.locale !== locale$$1) {
				translation = localeData.getTranslation(text, this.useKeys);
			}
		} else {
			isTranslated = true;
		}
		
		if (typeof translation === 'string') {
			text = translation;
		} else if (Array.isArray(translation) && translation.length && typeof count === 'number') {
			var variant = localeData.getTranslationVariant(translation, count);
			
			if (variant) {
				text = variant;
			}
		}

		if (values.length && (/%/).test(text)) {
			text = vsprintf(text, values);
		}

		if ((/{{.*}}/).test(text)) {
			text = text.replace(/{{(.*)}}/, function(match) {
				return 
			});
		}

		if (!isTranslated) {
			this.emit('untranslated', key, locale$$1);
		}
		
		return text;
	};

	// API

	/**
	 * Create API object
	 * @param {Object} obj 
	 */
	Lango.prototype.createApi = function createApi (obj) {
		if (obj[I18nSymbol]) {
			return;
		}

		for (var method in this.api) {
			var internalName = this.api[method];
			obj[method] = api[internalName] ? api[internalName].bind(obj, this) : this[internalName].bind(this);
		}

		obj[I18nSymbol] = true;

		return obj;
	};

	Object.defineProperties( Lango.prototype, prototypeAccessors );

	return Lango;
}());

export default lango;
