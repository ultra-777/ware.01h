var localization = require('../localization/service');

function applicationSettingsDto() {
	this.version = '';
	this.culture = '';
}

exports.applicationSettings = function(req, res, next) {
	var settings = new applicationSettingsDto();
	settings.version = '1.0.1';
	settings.culture = 'en-US';
	res.jsonp(settings);
};

exports.language = function(req, res, next) {
	var culture = req.query ? req.query.culture : undefined;
	res.jsonp(localization.load(culture));
};
