
"use strict";


var
    Sequelize = require('sequelize'),
    fs = require('fs'),
    path = require('path'),
    q = require('q'),
    util = require('../../common/util'),
    config = require('../../common/config');

var _sequelize = null;

function initSequelize(uri){
    _sequelize =
        new Sequelize(
            uri,
            {
                pool: true,
                logging: false
            }
        );

    var currentFileName = __filename;
    var initTasks = [];
    var configuration = [];
    var files = util.getGlobbedFiles(__dirname + '/**/*.js');

    files.forEach(function (item) {
        var resolvedPath = path.resolve(item);
        if (currentFileName !== resolvedPath) {
            var reference = require(resolvedPath);
            if (reference) {
                var model = reference.model;
                if (model) {
                    var schemaObject = model(_sequelize, Sequelize);
                    //schemaObject.name = schemaObject
                    if ((schemaObject.options) && (schemaObject.options.schema))
                        schemaObject.name = schemaObject.options.schema + '.' + schemaObject.name;
                     //console.log('-- model: ' + resolvedPath);
                }

                var init = reference.init;
                if (init) {
                    initTasks.push(init)
                    //console.log('-- init: ' + resolvedPath);
                }

                var config = reference.config;
                if (config) {
                    configuration.push(config)
                    //console.log('-- config: ' + resolvedPath);
                }

            }
        }
    });


    var promises = [];
    var initCount = initTasks.length;
    for (var i = 0; i < initCount; i++){
        var init = initTasks[i];
        if (init){
            promises.push(init(executeQuery, executeFileQuery));
        }
    }


    var configCount = configuration.length;
     for (var i = 0; i < configCount; i++){
        var configure = configuration[i];
        if ((configure !== undefined) && (configure !== null)){
            configure(getObject);
        }
    }

    configuration = null;

    var defer = q.defer();
    q.all(promises).then(function(results){
        defer.resolve(true);
    });
    return defer.promise;
}

function initSequelizeAndSynq(uri){

    var defer = q.defer();

    initSequelize(uri).then(function(result){


        var promise = _sequelize.sync();
        promise.then(function(){
            var currentFileName = __filename;
            var execute = [];
				util.getGlobbedFiles(__dirname + '/**/*.js').forEach(function(item) {
                var resolvedPath = path.resolve(item);
                if (currentFileName !== resolvedPath) {
                    var reference = require(resolvedPath);
                    if (reference) {
                        var exec = reference.exec;
                        if (exec) {
                            execute.push(exec)
                        }
                    }
                }
            });
            var promises = [];
            var execCount = execute.length;
            for (var i = 0; i < execCount; i++){
                var exec = execute[i];
                if (exec){
					promises.push(exec(executeQuery, executeFileQuery));
                }
            }
            q.all(promises).then(function(results){
                defer.resolve(true, null);
            });
        },
        function(err){
            defer.resolve(false, err);
        });

    });

    return defer.promise;
}

function getObject(objectName, schemaName){

    var name = schemaName ? (schemaName + '.' + objectName) : objectName;
    return _sequelize.model(name);
}

function executeQuery(query){
    return _sequelize.query(query);
}

function executeFileQuery(filePath){
    var fileContents = fs.readFileSync(filePath, "utf8");
    return executeQuery(fileContents);
}

function buildPath(nodeId, parentPath, repositoryLocation, isContainer, extension){
    var realFolderPath = '';
    if (parentPath) {
        var parentPathParts = parentPath.split('.');
        for (var p = 0; p < parentPathParts.length; p++) {
            realFolderPath += path.sep;
            realFolderPath += parentPathParts[p];
        }
    }
    if (realFolderPath.length > 0)
        realFolderPath += path.sep;
    if (nodeId) {
        realFolderPath += nodeId;
        if ((!isContainer) && extension)
            realFolderPath += ('.' + extension);
    }
    var result =
        repositoryLocation ?
            path.join(repositoryLocation, realFolderPath)
            : realFolderPath;
    return result;
}

module.exports = {
    init: initSequelize,
    initAndSynq: initSequelizeAndSynq,
    getObject: getObject,
    buildPath: buildPath
};

