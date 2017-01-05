
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
	// console.log('language.request.culture: ' + req.query.culture);
	var dictionary = {};
	dictionary.qwerty = 'QWERTY';
	res.jsonp(dictionary);
};
