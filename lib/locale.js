const LocaleStatus = {
	default: Symbol(),
	ready: Symbol(),
};

module.exports = class Locale {
	constructor(locale, data) {
		this.locale = locale;
		this.plural = [];
		this.translations = {};
		this.status = LocaleStatus.default;

		if (data) {
			this.setup(data);
		}
	}

	setup(data) {
		this.plural = data.plural || [1, null];
		this.translations = data.translations;
		this.status = LocaleStatus.ready;
	}

	get isReady() {
		return this.status === LocaleStatus.ready;
	}

	getTranslation(key, useKeys = false) {
		if (!useKeys) {
			return this.translations[key];
		}

		const parts = key.split('.');
		
		let part;
		let translation = this.translations;
		while (translation && (part = parts.shift())) {
			translation = translation[part];
		}
		
		return translation;
	}

	getTranslationVariant(translation, count) {
		let variant = -1;
		
		for (let i = 0; i < this.plural.length; i++) {
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
	}
};