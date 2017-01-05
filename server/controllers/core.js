'use strict';

/**
 * Module dependencies.
 */
exports.index = function(req, res) {
	res.render('index', {
		user: req.user || null
	});
};

exports.userInfo = function(req, res) {
    var result = {
        ip: req.ip,
        secure: req.secure
    };
    res.jsonp(result);
};

