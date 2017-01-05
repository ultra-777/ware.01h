'use strict';

/**
 * Module dependencies.
 */
var
	passport = require('passport'),
	dns = require('dns'),
	db = require('../models/storage/db'),
	result = require('../common/result'),
	_ = require('lodash');

/**
 * Get the error message from error object
 */
var getErrorMessage = function(err) {
	var message = '';

	if (err.code) {
		switch (err.code) {
			case 11000:
			case 11001:
				message = 'Username already exists';
				break;
			default:
				message = 'Something went wrong';
		}
	} else if (err.errors && (Object.prototype.toString.call( err.errors ) === '[object Array]' ))  {
		for (var errName in err.errors) {
			if (err.errors[errName].message)
				message = err.errors[errName].message;
		}
	} else {
		message = err.message;
	}

	return message;
};

/**
 * Signup
 */
exports.signup = function(req, res) {

    var accountSchema = db.getObject('account', 'security');
	if (!req.body.login || req.body.login.length < 1){
		res.jsonp(result.failure('Empty login is not allowed'));
		return;
	}

	if (!req.body.password || req.body.password.length < 1){
		res.jsonp(result.failure('Empty password is not allowed'));
		return;
	}
    accountSchema.create(
		req.body.login,
		req.body.password,
		req.body.email,
        req.body.firstName,
        req.body.lastName,
        'local',
        'user',
        function(account, err){
            if (err){
				res.jsonp(result.failure(getErrorMessage(err)));
            }
            else
                req.login(account, function (err) {
                    if (err) {
						res.jsonp(result.failure(getErrorMessage(err)));
                    } else {
                        res.jsonp(result.success(account));
                    }
                });
        });
}

/**
 * Signin after passport authentication
 */
exports.signin = function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (err || !user) {
			res.jsonp(result.failure(getErrorMessage(info)));
		} else {
			// Remove sensitive data before login
			user.password = undefined;
			user.salt = undefined;

			req.login(user, function(err) {
				if (err) {
					res.jsonp(result.failure(getErrorMessage(err)));
				} else {
					res.jsonp(result.success(user));
				}
			});
		}
	})(req, res, next);
};

/**
 * Signout
 */
exports.signout = function(req, res) {
	if (!req.user)
		res.jsonp(result.failure('the session is not authenticated'));
	else {
		var result1 = req.logout();
		res.jsonp(result.success(null));
	}
};

/**
 * Update user details
 */
exports.update = function(req, res) {
	// Init Variables
	var user = req.user;
	var message = null;

	// For security measurement we remove the roles from the req.body object
	if (req && req.body && req.body.roles)
		req.body.roles = null;

	if (user) {
		// Merge existing user
		user = _.extend(user, req.body);
		user.updated = Date.now();
		user.displayName = user.firstName + ' ' + user.lastName;

		user.save()
			.then(function () {
				req.login(user, function(err) {
					if (err) {
						res.send(400, err);
					} else {
						res.jsonp(user);
					}
					});
				})
			.catch(function(err){
				return res.send(400, {
					message: getErrorMessage(err)
				});
			});
	}
};

/**
 * Change Password
 */
exports.changePassword = function(req, res, next) {
	// Init Variables
	var passwordDetails = req.body;
	var message = null;

	if (req.user) {
		var userSchema = db.getObject('account', 'security');
		userSchema
			.find(
            {
                where: {id: req.user.id}
            })
			.then(function(user){
				if (user.authenticate(passwordDetails.currentPassword)) {
					if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
						user.password = user.hashPassword(passwordDetails.newPassword);
						user.updated = Date.now();
						user.save()
							.then(function() {
								req.login(user, function(err) {
									if (err) {
										res.send(400, err);
									} else {
										res.send({
											message: 'Password changed successfully'
										});
									}
								});
							})
							.catch(function(err) {
								return res.send(400, {
									message: getErrorMessage(err)
								});
							});

					} else {
						res.send(400, {
							message: 'Passwords do not match'
						});
					}
				} else {
					res.send(400, {
						message: 'Current password is incorrect'
					});
				}
			})
			.catch(function(err){
				res.send(400, {
					message: 'User is not found. ' + err
				});
			});

		} else {
			res.send(400, {
				message: 'User is not signed in'
			});
	}
};

/**
 * OAuth callback
 */
exports.oauthCallback = function(strategy) {
	return function(req, res, next) {
		passport.authenticate(strategy, function(err, user, redirectURL) {
			if (err || !user) {
				return res.redirect('/#!/authentication');
			}
			req.login(user, function(err) {
				if (err) {
					return res.redirect('/#!/authentication');
				}

				return res.redirect(redirectURL || '/');
			});
		})(req, res, next);
	};
};

/**
 * User middleware
 */
exports.userByID = function(req, res, next, id) {
	User.findOne({
		_id: id
	}).exec(function(err, user) {
		if (err) return next(err);
		if (!user) return next(new Error('Failed to load User ' + id));
		req.profile = user;
		next();
	});
};

/**
 * Require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
	if (!req.isAuthenticated()) {
		return res.send(401, {
			message: 'User is not logged in'
		});
	}

	next();
};

/**
 * User authorizations routing middleware
 */
exports.hasAuthorization = function(roles) {
	var _this = this;

	return function(req, res, next) {
		_this.requiresLogin(req, res, function() {
			if (_.intersection(req.user.roles, roles).length) {
				return next();
			} else {
				return res.send(403, {
					message: 'User is not authorized'
				});
			}
		});
	};
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function(req, providerUserProfile, done) {
	if (!req.user) {
		// Define a search query fields
		var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
		var searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

		// Define main provider search query
		var mainProviderSearchQuery = {};
		mainProviderSearchQuery.provider = providerUserProfile.provider;
		mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

		// Define additional provider search query
		var additionalProviderSearchQuery = {};
		additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

		// Define a search query to find existing user with current provider profile
		var searchQuery = {
			$or: [mainProviderSearchQuery, additionalProviderSearchQuery]
		};

		User.findOne(searchQuery, function(err, user) {
			if (err) {
				return done(err);
			} else {
				if (!user) {
					var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');

					User.findUniqueUsername(possibleUsername, null, function(availableUsername) {
						user = new User({
							firstName: providerUserProfile.firstName,
							lastName: providerUserProfile.lastName,
							username: availableUsername,
							displayName: providerUserProfile.displayName,
							email: providerUserProfile.email,
							provider: providerUserProfile.provider,
							providerData: providerUserProfile.providerData
						});

						// And save the user
						user.save(function(err) {
							return done(err, user);
						});
					});
				} else {
					return done(err, user);
				}
			}
		});
	} else {
		// User is already logged in, join the provider data to the existing user
		var user = req.user;

		// Check if user exists, is not signed in using this provider, and doesn't have that provider data already configured
		if (user.provider !== providerUserProfile.provider && (!user.additionalProvidersData || !user.additionalProvidersData[providerUserProfile.provider])) {
			// Add the provider data to the additional provider data field
			if (!user.additionalProvidersData) user.additionalProvidersData = {};
			user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;

			// Then tell mongoose that we've updated the additionalProvidersData field
			user.markModified('additionalProvidersData');

			// And save the user
			user.save(function(err) {
				return done(err, user, '/#!/settings/accounts');
			});
		} else {
			return done(new Error('User is already connected using this provider'), user);
		}
	}
};

/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function(req, res, next) {
	var user = req.user;
	var provider = req.param('provider');

	if (user && provider) {
		// Delete the additional provider
		if (user.additionalProvidersData[provider]) {
			delete user.additionalProvidersData[provider];

			// Then tell mongoose that we've updated the additionalProvidersData field
			user.markModified('additionalProvidersData');
		}

		user.save(function(err) {
			if (err) {
				return res.send(400, {
					message: getErrorMessage(err)
				});
			} else {
				req.login(user, function(err) {
					if (err) {
						res.send(400, err);
					} else {
						res.jsonp(user);
					}
				});
			}
		});
	}
};


exports.getSessionInfo = function(req, res) {

	var theIp = '';
	if (req.ips && req.ips.length){
		for (var i =0;i < req.ips.length; i++){
			if (theIp.length > 0)
				theIp = theIp + ', ';
			theIp = theIp + req.ips[i].toString();
		}
	}
	else if (req.ip)
		theIp = req.ip.toString();

	var nginxProxy = (req.headers ? req.headers['x-nginx-proxy'] : null);
	var isSecure = nginxProxy ? (req.headers['x-forwarded-protocol'] == 'https') : req.secure;

	var resultData = {
		ip: theIp,
		isSecure: isSecure,
		account: req.user
	};


	var schemaSession = db.getObject('session', 'security');
	schemaSession.get(req.session.id, function(err, data){

		if (data)
			resultData.agent = data.agent;

		dns.reverse(theIp, function(err, hostNames){
			if (hostNames && hostNames.length && hostNames.length > 0)
				resultData.host = hostNames[0];
			res.jsonp(result.success(resultData));
		});
	});
};