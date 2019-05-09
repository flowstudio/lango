module.exports = class Driver {
	constructor(options = {}) {
		this.cache = typeof options.cache === 'boolean' ? options.cache : false;
		this.cacheData = {};
		this.requests = {};
	}

	getCache(key) {
		return this.cacheData[key];
	}

	storeCache(key, data) {
		this.cacheData[key] = data;
	}

	getRequest(key) {
		return this.requests[key];
	}

	storeRequest(key, request) {
		this.requests[key] = request;
	}

	deleteRequest(key) {
		delete this.requests[key];
	}

	getLocaleKey(locale, namespace = null) {
		return (namespace ? namespace + '.' : '') + locale;
	}
};