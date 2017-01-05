'use strict';

/**
 * Module dependencies.
 */
var express = require('express'),
	morgan = require('morgan'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	compress = require('compression'),
	methodOverride = require('method-override'),
	cookieParser = require('cookie-parser'),
	helmet = require('helmet'),
	passport = require('passport'),
	flash = require('connect-flash'),
	config = require('../common/config'),
	consolidate = require('consolidate'),
	path = require('path'),
	util = require('../common/util'),
	routing = require('../routing/default'),
	store = require('./store')({
		session: session,
		options: {
			defaultExpirationTime:  config.sessionExpirationTime
			,updateTimeout: config.sessionUpdateTimeout
		}
	});

module.exports = function() {
	var app = express();

	util.getGlobbedFiles('../models/**/*.js').forEach(function(modelPath) {
		require(path.resolve(modelPath));
	});


	app.use(compress({
		filter: function(req, res) {
			return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
		},
		level: 9
	}));

	app.set('showStackError', true);

	if (process.env.NODE_ENV === 'development') {
		// Enable logger (morgan)
		app.use(morgan('dev'));

		// Disable views cache
		app.set('view cache', false);
	} else if (process.env.NODE_ENV === 'production') {
		app.locals.cache = 'memory';
	}

	app.use(bodyParser.urlencoded({extended: false }));
    app.use(bodyParser.json());
	app.use(methodOverride());

	app.enable('jsonp callback');

	app.use(cookieParser());

	app.use(session({
		secret: config.sessionSecret
        ,cookie: {
            path: '/'
            , httpOnly: true
			, overwrite: true
		}
		,store: new store(),
        resave: true,
        saveUninitialized: true

    }));

	app.use(passport.initialize());
	app.use(passport.session());

	app.use(flash());

	app.use(helmet.frameguard());
	app.use(helmet.xssFilter());
	app.use(helmet.noSniff());
	app.use(helmet.ieNoOpen());
	app.disable('x-powered-by');
	app.enabled('trust proxy');
	app.set('trust proxy', true);

	var target = path.join(__dirname,'../../client');
	app.use(express.static(target));

	if (routing){
		routing(app);
	}

	return app;
};