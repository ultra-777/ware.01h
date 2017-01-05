'use strict';

var passport = require('passport'),
	db = require('../models/storage/db'),
	path = require('path'),
	config = require('../common/config'),
	localStrategy = require('passport-local').Strategy;

module.exports = function() {
	// Serialize sessions
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// Deserialize sessions
	passport.deserializeUser(function(req, id, done) {

		var session = req.session;

		var accountScheme = db.getObject('account', 'security');
		var roleScheme = db.getObject('role', 'security');
		accountScheme
			.find(
			{
				where: { id: id },
				include: [{ model: roleScheme, as: 'roles' }]
			})
			.then(function(user){
				user.password = undefined;
				user.salt = undefined;
				done(null, user);
			})
			.catch(function(err){
				done(err, null);
			});

	});

	passport.use(new localStrategy({
			usernameField: 'login',
			passwordField: 'password'
		},
		function(login, password, done) {

			var user = db.getObject('account', 'security');
			var role = db.getObject('role', 'security');
			// console.log('-- strategies/local finding user: ' + login);
			user.find(
				{
					where: { name: login },
					include: [{ model: role, as: 'roles' }]
				})
				.then(function(user){
					if (!user){
						return done(null, false, { message: 'Unknown user'} );
					}
					if (!user.authenticate(password)) {
						return done(null, false, {
							message: 'Invalid password'
						});
					}

					return done(null, user);
				})
				.catch(function(err) {
					console.log(err);
					return done(err);
				});
		}
	));
};