(function () {
    'use strict';

    const buildRegexp = /(-build\s*=\s*)([a-zA-Z0-9]+)([\s]*)/i;
	const buildMatchIndex = 2;

	function initBuildEnvironment(){
		if (process.argv && process.argv.length > 0){
			process.argv.every(function(element, index, array) {
				var match = buildRegexp.exec(element);
				if (match) {
					var argument = match[buildMatchIndex];
					if (argument) {
						process.env.BUILD = argument.toLowerCase();
						return false;
					}
				}
				return true;
			});
		}
	}

    function config() {
        this.ENV_DEVELOPMENT = 'development';
        this.ENV_PRODUCTION = 'production';
		this.targetRoot = './dist/client';
		this.targetModulePrefix = 'default';
		this.targetModulePostfix = '.module.ts';
		this.targetModuleFactoryPostfix = '.module.ngfactory';
		this.initBuildEnvironment = initBuildEnvironment;
    };

    module.exports = new config();
}());