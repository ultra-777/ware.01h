(function () {
    'use strict';

    function config() {
        this.ENV_DEVELOPMENT = 'development';
        this.ENV_PRODUCTION = 'production';
    };

    module.exports = new config();
}());