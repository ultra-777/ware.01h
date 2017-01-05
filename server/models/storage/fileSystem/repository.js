"use strict";

var fs = require('fs');
var db = require('../db');
var config = require('../../../common/config');

function model(sequelize, DataTypes) {

    var definition =
        sequelize.define(
            "repository",
            {
                id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
                name: { type: DataTypes.STRING(256), unique: true, allowNull: false },
                location: { type: DataTypes.STRING(2048) },
                isOpen: { type: DataTypes.BOOLEAN, defaultValue: false },
                childFilesLimit: { type: DataTypes.BIGINT, allowNull: false },
                childFoldersLimit: { type: DataTypes.BIGINT, allowNull: false },
                created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "fileSystem",

                // define the table's name
                tableName: 'Repository',


                classMethods: {

                    findInstance: function(name, callback/*function(instance, error)*/) {
                        var repositorySchema = db.getObject('repository', 'fileSystem');
                        repositorySchema
                            .findAll({where: (name ? {name: name} : true )})
                            .then(function(instances) {
                                callback && callback (instances, null);
                            })
                            .catch(function(err){
                                callback && callback (null, err);
                            });
                    },

                    get: function(id, callback/*function(instance, error)*/) {
                        var repositorySchema = db.getObject('repository', 'fileSystem');
                        repositorySchema
                            .find({where: {id: id}})
                            .then(function(instance) {
                                callback && callback (instance, null);
                            })
                            .catch(function(err){
                                callback && callback (null, err);
                            });
                    },

                    create: function (name, location, isOpen, callback) {
                        fs.stat(location, function(err, stat) {
                            if (err) {
                                callback && callback(null, err);
                            }
                            else if (stat.isDirectory()) {

                                fs.readdir(location, function (err, files) {
                                    if (err) {
                                        callback && callback(null, err);
                                    }
                                    else if (files && files.length > 0) {
                                        callback && callback(null, {message: 'The folder is not empty: ' + location});
                                    }
                                    else {


                                        var repositorySchema = db.getObject('repository', 'fileSystem');
                                        repositorySchema
                                            .find({
                                                where: {name: name}
                                            })
                                            .then(function (result) {
                                                if (result)
                                                    callback && callback(null, 'Repository already exists');
                                                else {
                                                    sequelize
                                                        .transaction({
                                                            autocommit: 'off',
                                                            isolationLevel: 'REPEATABLE READ'
                                                        })
                                                        .then(function (t) {
                                                            var newRepository =
                                                                repositorySchema
                                                                    .build({
                                                                            name: name,
                                                                            location: location,
                                                                            isOpen: isOpen,
                                                                            childFilesLimit: config.repositoryChildFilesLimit,
                                                                            childFoldersLimit: config.repositoryChildFoldersLimit
                                                                        },
                                                                        {transaction: t});

                                                            newRepository
                                                                .save({transaction: t})
                                                                .catch(function (err) {
                                                                    t.rollback();
                                                                    callback && callback(null, err);
                                                                })
                                                                .then(function (newInstance) {
                                                                    t.commit()
                                                                        .catch(function (err) {
                                                                            callback && callback(null, err);
                                                                        })
                                                                        .then(function () {
                                                                            callback && callback(newInstance, null);
                                                                        });
                                                                });
                                                        })
                                                }
                                            })
                                            .catch(function (err) {
                                                callback && callback(null, err);
                                            });
                                    }
                                });
                            }
                        });
                    },

                    delete: function (id, callback/*function(instance, error)*/) {

                        var repositorySchema = db.getObject('repository', 'fileSystem');
                        repositorySchema
                            .find({where: {id: id}})
                            .then(function(instance) {

                                if (instance == null){
                                    callback && callback(false, null);
                                }
                                else {

                                    sequelize
                                        .transaction({
                                            autocommit: 'off',
                                            isolationLevel: 'REPEATABLE READ'})
                                        .then(function (t) {
                                            instance
                                                .destroy({transaction: t})
                                                .catch(function (err) {
                                                    t.rollback();
                                                    callback && callback(false, err);
                                                })
                                                .then(function (affectedRows) {
                                                    t.commit();
                                                    callback && callback(true, null);
                                                });
                                        });
                                }
                            })
                            .catch(function(err){
                                callback && callback (null, err);
                            });
                    },

                    update: function (id, name, location, isOpen, callback/*function(instance, error)*/) {



                        var repositorySchema = db.getObject('repository', 'fileSystem');
                        repositorySchema
                            .find({where: {id: id}})
                            .then(function(instance) {
                                if (instance){
                                    fs.stat(location, function(err, stat) {
                                        if (err){
                                            callback && callback(null, err);
                                        }
                                        else if (stat.isDirectory()){

                                            fs.readdir(location, function (err, files) {
                                                if (err) {
                                                    callback && callback(null, err);
                                                }
                                                else if ((instance.location != location) && files && (files.length > 0)) {
                                                    callback && callback(null, {message: 'The folder is not empty: ' + location});
                                                }
                                                else {


                                                    instance.name = name;
                                                    instance.location = location;
                                                    instance.isOpen = isOpen;

                                                    sequelize
                                                        .transaction({
                                                            autocommit: 'off',
                                                            isolationLevel: 'REPEATABLE READ'
                                                        })
                                                        .then(function (t) {
                                                            instance.save({
                                                                    transaction: t
                                                                })
                                                                .then(function (affectedRows) {
                                                                    t.commit()
                                                                        .then(function () {
                                                                            callback && callback(instance, null);
                                                                        })
                                                                        .catch(function (err) {
                                                                            callback && callback(null, err);
                                                                        });

                                                                })
                                                                .catch(function (err) {
                                                                    t.rollback();
                                                                    callback && callback(null, err);
                                                                });
                                                        });


                                                }
                                            });

                                        }
                                        else {
                                            callback && callback(null, 'Invalid path: ' + (location ? location : ''));
                                        }
                                    });

                                }
                                else {
                                    callback && callback(null, null);
                                }
                            })
                            .catch(function(err){
                                callback && callback (null, err);
                            });
                    }
                }
            }
        );

    return definition;
};

function exec(executeQueryHandler){

    var repositoryName = config.fileRepositoryName;
    var repositoryPath = config.fileRepositoryDefaultPath;

    if (!repositoryPath)
        return;

    if (!fs.existsSync(repositoryPath))
        fs.mkdirSync(repositoryPath, '0600');

    if (!fs.existsSync(repositoryPath))
        return;

    var query =
        'insert into "fileSystem"."Repository" ' +
        '("name", "location", "isOpen", "childFilesLimit", "childFoldersLimit", "created") select '+
        '\'' +
        repositoryName +
        '\'' +
        ', ' +
        '\'' +
        repositoryPath +
        '\'' +
        ', true,' +
        config.repositoryChildFilesLimit +
        ', ' +
        config.repositoryChildFoldersLimit +
        ', ' +
        'current_timestamp ' +
        'where not exists (select id from "fileSystem"."Repository" limit 1);';

    executeQueryHandler(query)
        .error(function(err){
            console.error('Exception: %s (%s)', err.message, err.sql);
        });
}


module.exports = {
    model: model,
    exec: exec
};

