const vsprintf = require('sprintf-js').vsprintf;
const Locale = require('./locale');
const api = require('./api');

const I18nSymbol = Symbol();

module.exports = class Lango {
	constructor(options = {}) {
		this.configure(options);
	}

	/**
	 * Configure i18n
	 * @param {Object} options
	 */
	configure(options = {}) {
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
		
		const locales = options.locales || [];
		const data = options.data || {};

		locales.forEach(locale => {
			this.addLocale(locale, data[locale])
		});

		this.defaultLocale = options.defaultLocale || Object.keys(this.locales)[0];

		this.setLocale = api.setLocale.bind(this, this);

		const locale = options.locale || this.defaultLocale;
		if (locale) {
			this.setLocale(locale);
		}
	}

	// Events

	/**
	 * Add event listener
	 * @param {String} event 
	 * @param {Function} handler 
	 */
	on(event, handler) {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}

		this.listeners[event].push(handler);
	}
	
	/**
	 * Remove event listener
	 * @param {String} event 
	 * @param {Function} handler 
	 */
	off(event, handler) {
		const listeners = this.listeners[event];

		if (!listeners) {
			return;
		}

		const index = listeners.indexOf(handler);
		index !== -1 && listeners.splice(index, 1);
	}

	/**
	 * Emit event
	 * @param {String} event 
	 */
	emit(event) {
		const listeners = this.listeners[event];

		if (!listeners) {
			return;
		}

		const args = Array.prototype.slice.call(arguments, 1);

		for (let i = 0; i < this.listeners.length; i++) {
			this.listeners[i].apply(args);
		}
	}
	
	// Locales
	getLocales() {
		return Object.keys(this.locales);
	}
	
	hasLocale(locale) {
		return this.locales.hasOwnProperty(locale);
	}

	hasFallbackLocale(locale) {
		return this.fallbacks.hasOwnProperty(locale);
	}
	
	addLocale(locale, data) {
		if (this.locales[locale]) {
			throw new Error('Language already added.');
		}
		
		this.locales[locale] = new Locale(locale, data);

		if (!this.defaultLocale) {
			this.defaultLocale = locale;
		}
	}
	
	removeLocale(locale) {
		if (!this.locales[locale]) {
			throw new Error('Language not available.');
		}

		delete this.locales[locale];
	}

	getLocale(locale) {
		return this.locales[locale];
	}

	getFallbackLocale(locale) {
		return this.fallbacks[locale] || this.defaultLocale;
	}

	guessLanguage(obj) {
		let header;

		if (typeof obj === 'object' && obj.headers) {
			header = obj.headers['accept-language'] || '';
		} else if (typeof obj === 'string') {
			header = obj;
		}

		if (!header) {
			return;
		}

		const requested = header.split(',').filter(item => item).map(item => {
			const data = item.split(';q=');
			return {
				locale: data[0],
				quality: data[1] ? parseFloat(data[1]) || 0.0 : 1.0,
			};
		}).sort((a, b) => {
			return a.quality - b.quality;
		});

		for (let i = 0; i < requested.length; i++) {
			let locale = requested[i];
			if (this.hasLocale(locale.locale)) {
				return locale.locale;
			} else if (this.hasFallbackLocale(locale.locale)) {
				return locale.locale;
			}
		}
	}
	
	prepare(locale) {
		const localeData = this.getLocale(locale || this.locale);

		return localeData && localeData.loadPromise ? localeData.loadPromise : Promise.resolve();
	}

	// Translation

	parseValues(args) {
		let namedValues = {};
		let values = [];

		if (args.length < 2) {
			return {namedValues, values};
		}

		const lastArg = args[args.length-1];
		let valuesLength = args.length;
		if (lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg)) {
			namedValues = lastArg;
			valuesLength -= 1;
		}

		Array.prototype.slice.call(args, 1, valuesLength).forEach(value => {
			values.push.apply(values, Array.isArray(value) ? value : [value]);
		});

		return {namedValues, values};
	}
	
	translate(text, count) {
		let key;
		let locale = this.locale;

		// parse values
		const {namedValues, values} = this.parseValues(arguments);

		// normalize params
		if (typeof text === 'object') {
			key = text.text;

			if (text.locale) {
				if (!this.hasLocale(text.locale)) {
					throw new Error('Invalid locale.');
				}

				locale = text.locale;
			}
		} else if (typeof text === 'string') {
			key = text;
		} else {
			throw new Error('Invalid key to translate.');
		}

		text = key;

		let localeData = this.getLocale(locale);

		let isTranslated = false;
		let translation = localeData.getTranslation(text, this.useKeys);

		if (!translation) {
			localeData = this.getLocale(this.getFallbackLocale(locale));

			if (localeData.locale !== locale) {
				translation = localeData.getTranslation(text, this.useKeys);
			}
		} else {
			isTranslated = true;
		}
		
		if (typeof translation === 'string') {
			text = translation;
		} else if (Array.isArray(translation) && translation.length && typeof count === 'number') {
			const variant = localeData.getTranslationVariant(translation, count);
			
			if (variant) {
				text = variant;
			}
		}

		if (values.length && (/%/).test(text)) {
			text = vsprintf(text, values);
		}

		if ((/{{.*}}/).test(text)) {
			text = text.replace(/{{(.*)}}/, function(match, name) {
				return namedValues.hasOwnProperty(name) ? namedValues[name] : name;
			});
		}

		if (!isTranslated) {
			this.emit('untranslated', key, locale);
		}
		
		return text;
	}

	// API

	/**
	 * Create API object
	 * @param {Object} obj 
	 */
	createApi(obj) {
		if (obj[I18nSymbol]) {
			return;
		}

		for (let method in this.api) {
			const internalName = this.api[method];
			obj[method] = api[internalName] ? api[internalName].bind(obj, this) : this[internalName].bind(this);
		}

		obj[I18nSymbol] = true;

		return obj;
	}
};