
"use strict";

var q = require('q');

function execute(executeQueryHandler, executeFileQueryHandler){
    var defer = q.defer();
    var promises = [];
    promises.push(executeFileQueryHandler(__dirname + '/addFile.sql'));
    promises.push(executeFileQueryHandler(__dirname + '/dropContainerNode.sql'));
    q.all(promises).then(function(results){
        defer.resolve(true);
    });
    return defer.promise;
}

function init(executeQueryHandler, executeFileQueryHandler){
    return executeQueryHandler('CREATE SCHEMA IF NOT EXISTS "fileSystem"');
}


module.exports = {
    exec: execute,
    init: init
};
