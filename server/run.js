'use strict';
var kernel = require('./application/kernel');
kernel().then(function(launchingInfo){
	if (launchingInfo.succeeded) {
		console.log("Express server listening on host: " + launchingInfo.server + " port: " + launchingInfo.port);
	}
	else {
		console.log('application launching failed: ' + launchingInfo.error);
	}
});

