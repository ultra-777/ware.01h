(function () {
    'use strict';


    var gulp = require('gulp'),
        sequence = require('run-sequence'),
        initClient = require('./client/gulpfile.js'),
        client = new initClient(),
	    initServer = require('./server/gulpfile.js'),
		server = new initServer();

	gulp.task('development', [], function (callback) {
		sequence(
			'client-development',
			'server-production',
			callback
		);
	});

	gulp.task('production', [], function (callback) {
		sequence(
			'client-production',
			'server-production',
			callback
		);
	});
}());
