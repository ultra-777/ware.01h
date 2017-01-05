'use strict';
var exec = require('child_process').exec;
var smtp = require('../models/smtp')();

exports.send = function(req, res) {
    send(req.body.mail);
    res.jsonp(true);
};


function send(mail){
    smtp(mail, function(err, reply) {
        console.log(err && err.stack);
        console.dir(reply);
    });
}