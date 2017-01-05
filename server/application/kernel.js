var config = require('../common/config');
var http = require('http');
var q = require('q');
var db = require('../models/storage/db');
var initExpress = require('./express');
var initPassport = require('./passport');

function launchingInfo(succeeded, host, port, error) {
	this.succeeded = succeeded;
	this.server = host;
	this.port = port;
	this.error = error;
}

module.exports = function() {
	var defer = q.defer();
	db
		.initAndSynq(config.db)
		.then(function () {
			try {
				var app = initExpress();
				initPassport();
				var server = http.createServer(app);

				server.listen(config.port, config.host, function () {
					defer.resolve(new launchingInfo(true, config.host, config.port));
				});
			}
			catch (err) {
				defer.resolve(new launchingInfo(false, null, null, err));
			}
		});

	return defer.promise;
}
