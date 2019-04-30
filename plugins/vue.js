const I18n = require('../lib/i18n');

module.exports = class VueI18n extends I18n {
	subscribeData(vm) {
		vm._i18nListener = vm._i18nListener || (() => {
			vm.$nextTick(function() {
				this.$forceUpdate();
			});
		});

		this.on('update', vm._i18nListener);
	}
	
	unsubscribeData(vm) {
		this.off('update', vm._i18nListener);
	}
};