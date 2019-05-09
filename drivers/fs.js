const fs = require('fs');
const Driver = require('./driver');

module.exports = class FsDriver extends Driver {
	constructor(options = {}) {
		super(options);

		this.path = options.path;
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

		request = new Promise((resolve, reject) => {
			fs.readFile(this.path + '/' + key + '.json', (err, data) => {
				if (err) {
					return reject(err);
				}

				try {
					data = JSON.parse(data);

					resolve(data);
				} catch (err) {
					reject(err);
				}
			});
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