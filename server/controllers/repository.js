'use strict';

var repositoryImpl = require('../models/repository');
var result = require('../common/result');

exports.find = function(req, res) {
    checkAuthorization(req, res, function() {
        repositoryImpl
            .find(req.body.name, function (instances, error) {
                if (error)
                    res.jsonp(result.failure(error.message));
                else {
                    if (!instances)
                        instances = [];
                    res.jsonp(result.success(instances));
                }
            });
    });
};

exports.get = function(req, res) {
    checkAuthorization(req, res, function() {
        repositoryImpl
            .get(req.body.id, function (instance, error) {
                if (error)
                    res.jsonp(result.failure(error.message));
                else {
                    res.jsonp(result.success(instance));
                }
            });
    });
};

exports.update = function(req, res) {
    checkAuthorization(req, res, function() {
        repositoryImpl
            .update(req.body.id, req.body.name, req.body.location, req.body.isOpen, function (instance, error) {
                if (error)
                    res.jsonp(result.failure(error.message));
                else {
                    res.jsonp(result.success(instance));
                }
            });
    });
};

exports.create = function(req, res) {
    checkAuthorization(req, res, function() {
        repositoryImpl
            .create(req.body.name, req.body.location, req.body.isOpen, function (instance, error) {
                if (error)
                    res.jsonp(result.failure(error.message));
                else {
                    res.jsonp(result.success(instance));
                }
            });
    });
};

exports.delete = function(req, res) {
    checkAuthorization(req, res, function() {
        repositoryImpl
            .delete(req.body.id, function (resultValue, error) {
                if (error)
                    res.jsonp(result.failure(error.message));
                else {
                    res.jsonp(result.success(true));
                }
            });
    });
};

function checkAuthorization(req, res, callback/*function()*/){
    var roles = (req.user && req.user.roles) ? req.user.roles : [];
    var isAdmin = false;
    var i = roles.length;
    while (i--) {
        var candidate = roles[i];
        if (candidate && (candidate.name == 'admin')) {
            isAdmin = true;
            break;
        }
    }

    if (isAdmin) {
        callback && callback();
    }
    else {
        res.status(401).send({message: 'User is not administrator'});
    }
}


