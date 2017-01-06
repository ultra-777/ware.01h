'use strict';

const defaultCulture = 'en-US';

var nodeFs  = require('fs');

exports.load = function(culture){
	var cultureFile = getCultureFileName(culture);
	if (nodeFs.existsSync(cultureFile)){
		return require(cultureFile);
	}

	return require(getCultureFileName());
}

function getCultureFileName(culture){
	return './' + (culture || defaultCulture) + '.json';
}
