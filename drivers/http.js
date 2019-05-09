const Driver = require('./driver');

module.exports = class HttpDriver extends Driver {
	constructor(options = {}) {
		super(options);

		this.url = options.url;
	}

	load(locale, namespace = null) {
		const key = this.getLocaleKey(locale, namespace);
		const cache = this.getCache(key);
		
		if (cache) {
			return Promise.resolve(cache);
		}

		let request = this.getRequest(key);

		if (request) {
			return request;
		}

		request = fetch(this.url + '/' + key + '.json')
		.then(resource => {
			return resource.json();
		});

		this.requests = request;

		return request.then(data => {
			this.deleteRequest(request);

			if (this.cache) {
				this.storeCache(key, data);
			}

			return data;
		});
	}
}