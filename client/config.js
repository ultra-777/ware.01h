(function () {
    'use strict';

    function config() {
        this.ENV_DEVELOPMENT = 'development';
        this.ENV_PRODUCTION = 'production';
        this.buildRegexp = /(-build\s*=\s*)([a-zA-Z0-9]+)([\s]*)/i;
		this.buildMatchIndex = 2;
		this.targetModulePrefix = 'default';
		this.targetModulePostfix = '.module.ts';
		this.targetModuleFactoryPostfix = '.module.ngfactory';
    };

    module.exports = new config();
}());