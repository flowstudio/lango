const I18n = require('../lib/i18n');

const i18n = new I18n({
	locales: ['en', 'sk'],
	locale: 'sk',
	data: {
		en: {
			translations: {
				hello: 'Hello %s',
			}
		},
		sk: {
			translations: {
				hello: [
					'%d Ahoj %s',
					'%d Ahojte %s',
				]
			}
		}
	}
});

const api = {
	res: 'asdsa',
};

i18n.createApi(api);

api.setLocale('en');

console.log(i18n.translate('hello', 1, ['Andrej']));
console.log(api.translate('hello', ['Andrej']));