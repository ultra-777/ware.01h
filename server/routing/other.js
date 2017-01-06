'use strict';

var configuration = require('../controllers/configuration');

module.exports = function(app) {

	app.route('/configuration/applicationSettings').get(configuration.applicationSettings);
	app.route('/configuration/localization').get(configuration.language);

};
