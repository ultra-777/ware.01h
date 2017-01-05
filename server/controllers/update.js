'use strict';
var exec = require('child_process').exec;
var result = require('../common/result');

exports.pull = function(req, res) {
    checkAuthorization(req, res, function() {

        execute(
            'git pull',
            function (callback) {
                res.jsonp(callback);
            });
    });
};

exports.install = function(req, res) {
    checkAuthorization(req, res, function() {
        execute('npm install',
            function (callback) {
                res.jsonp(callback);
            });
    });
};

exports.build = function(req, res) {
    checkAuthorization(req, res, function() {
        execute('gulp production',
            function (callback) {
                res.jsonp(callback);
            });
    });
};

exports.restart = function(req, res) {
    checkAuthorization(req, res, function() {
        var line = 'reboot';
        execute(line,
            function (callback1) {
                console.log(callback1);
                res.jsonp(callback1);
            });
    });
};


function execute(command, callback){
    var startMoment = (new Date()).toUTCString();
    exec(command,
        {
            encoding: 'utf8',
            timeout: 0,
            maxBuffer: 1024*1024,
            killSignal: 'SIGTERM',
            cwd: null,
            env: null
        },
        function(error, stdout, stderr){

            var stopMoment = (new Date()).toUTCString();

            var output = 'started: ' + startMoment;
            if (stdout)
                output = output + '\r\n\r\n' + stdout;

            if (stderr)
                output = output + '\r\n' + stderr;

            output = output + '\r\n\r\ncomplete: ' + stopMoment;

            var exactResult = (error || stderr) ? result.failure(output) : result.success(output);

            callback(exactResult);
        });
}

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


