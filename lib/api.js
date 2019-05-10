exports.setLocale = function(i18n, name) {
	if (!i18n.hasLocale(name)) {
		throw new Error('Language not available.');
	}

	if (!this.locale) {
		this.locale = name;
	}

	const locale = i18n.getLocale(name);

	if (locale.isReady) {
		this.locale = name;
		this === i18n && this.emit('update');
		return Promise.resolve();
	}

	if (!locale.loadPromise) {
		if (!i18n.driver) {
			throw new Error('No language driver provided.');
		}

		locale.loadPromise = i18n.driver.load(name, i18n.namespace).then(data => {
			locale.setup(data);
			locale.loadPromise = null;
		});
	}

	return locale.loadPromise.then(() => {
		this.locale = name;
		this === i18n && this.emit('update');
	});
};

exports.translate = function(i18n, text, ...args) {
	if (typeof text === 'object') {
		text.locale = text.locale || this.locale;
	} else {
		text = {
			text,
			locale: this.locale,
		};
	}

	return i18n.translate(text, ...args);
};

exports.prepare = function(i18n, locale) {
	return i18n.prepare(locale || this.locale);
}