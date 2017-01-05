"use strict";

var fs = require('fs');
var path = require('path');
var config = require('../../../common/config');
var db = require('../db');
var common = require('../../common');


function model(sequelize, DataTypes) {

    var definition =
        sequelize.define(
            "file",
            {
                id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
                name: { type: DataTypes.STRING(1024), allowNull: false },
                extension: { type: DataTypes.STRING(128), allowNull: false },
                folderPath: { type: DataTypes.STRING, allowNull: false },
                folderId: { type: DataTypes.BIGINT, allowNull: false },
                repositoryId: { type: DataTypes.BIGINT, allowNull: false },
                size: { type: DataTypes.BIGINT, allowNull: false },
                created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "fileSystem",

                // define the table's name
                tableName: 'File',

                hooks: {
                    'afterDestroy': function(file, fn) {
                        try {
                            var fileLocation = file.getLocation();
                            if (fileLocation)
                                fs.unlinkSync(fileLocation);
                        }
                        catch (err){
                            console.error('file.afterDestroy: ' + err);
                        }
                    }
                },


                classMethods: {

                    create: function (repositoryName, name, size, theTransaction, callback) {

                        var query =
                            'select * from "fileSystem"."addFile"(' +
                            (repositoryName ? '\'' + repositoryName + '\'' : 'null') +
                            ', ' +
                            (name ? '\'' + name + '\'' : 'null') +
                            ', ' +
                            (config.repositoryFileExtension ? '\'' + config.repositoryFileExtension + '\'' : 'null') +
                            ', ' +
                            size +
                            ');';

                        var callee = {
                            build: function (result, config) {
                                return result;
                            },
                            bulkBuild: function (result, config) {
                                return result;
                            }
                        };

                        sequelize
                            .query(query, {transaction: theTransaction, model: callee, plain: true})
                            .then(function (newFile) {
                                if (newFile){
                                    var folderLocation = db.buildPath(null, newFile.folderPath, newFile.repositoryLocation, true);
                                    if (!fs.existsSync(folderLocation)) {
                                        fs.mkdirSync(folderLocation, common.accessPermission);
                                    }

                                    var fileSchema = sequelize.model('fileSystem.file');
                                    var folderSchema = sequelize.model('fileSystem.folder');
                                    var repositorySchema = sequelize.model('fileSystem.repository');
                                    fileSchema
                                        .find(
                                        {
                                            where: { id: Number(newFile.newFileId) },
                                            include: [
                                                { model: folderSchema, as: 'folder' },
                                                { model: repositorySchema, as: 'repository' }
                                            ],
                                            transaction: theTransaction
                                        })
                                        .then(function(result){
                                            callback && callback(result, null);
                                        })
                                        .catch(function(err){
                                                callback && callback(null, err);
                                        });
                                }
                                else
                                    callback && callback(null, 'No file created');
                            })
                            .catch(function(err){
                                callback && callback(null, err);
                            });
                    }
                },

                instanceMethods: {

                    getLocation: function () {
                        return path.join(this.repository.location, this.folder.getLocation(false), (this.id + '.' + this.extension));
                    }
                }
            }
        );
    return definition;
};

function configure(getObjectHandler){
    var file = getObjectHandler('file', 'fileSystem');
    var folder = getObjectHandler('folder', 'fileSystem');
    var repository = getObjectHandler('repository', 'fileSystem');
    folder.hasOne(file, {as: 'folder', foreignKey : 'folderId'});
    repository.hasOne(file, {as: 'repository', foreignKey : 'repositoryId'});
    file.belongsTo(folder);
    file.belongsTo(repository);
}




module.exports = {
    model: model,
    config: configure
};

