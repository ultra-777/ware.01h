"use strict";

var fs = require('fs');
var db = require('../db');

function model(sequelize, DataTypes) {

    var definition =
        sequelize.define(
            "node",
            {
                id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
                treeId: { type: DataTypes.BIGINT, allowNull: false },
                isContainer: { type: DataTypes.BOOLEAN, allowNull: false },
                name: { type: DataTypes.STRING(1024), allowNull: false },
                parentId: { type: DataTypes.BIGINT},
                fileId: { type: DataTypes.BIGINT},
                created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "fileSystem",

                // define the table's name
                tableName: 'Node',

                classMethods: {

                    get: function(
                        nodeId,
                        theTransaction,
                        callback/*function(node, error)*/
                    ){
                        var nodeSchema = sequelize.model('fileSystem.node');
                        var treeSchema = sequelize.model('fileSystem.tree');
                        var userSchema = sequelize.model('security.account');
                        var fileSchema = sequelize.model('fileSystem.file');
                        var folderSchema = sequelize.model('fileSystem.folder');
                        var repositorySchema = sequelize.model('fileSystem.repository');

                        nodeSchema
                            .find({
                                where: {id: nodeId},
                                transaction: theTransaction,
                                include: [
                                    {
                                        model: fileSchema,
                                        as: 'file',
                                        include: [{
                                            model: folderSchema,
                                            as: 'folder',
                                            include: [{
                                                model: repositorySchema,
                                                as: 'repository'
                                            }]},
                                            {
                                                model: repositorySchema,
                                                as: 'repository'
                                            }
                                        ]
                                    },
                                    {
                                        model: treeSchema,
                                        as: 'tree',
                                        include: [{
                                            model: userSchema,
                                            as: 'owner'
                                        }]
                                    }
                                ]
                            })
                            .then(function(node){
                                callback && callback(node, null);
                            })
                            .catch(function(err){
                                callback && callback(null, err);
                            });
                    },

                    moveChild: function(
                        parentId,
                        childId,
                        callback/*function(node, error)*/
                    ){
                        var nodeSchema = sequelize.model('fileSystem.node');

                        nodeSchema
                            .find({
                                where: {id: childId}
                            })
                            .then(function(node){

                                node.parentId = parentId;
                                node
                                    .save()
                                    .then(function (affectedRows) {
                                            callback && callback(true, null);
                                        })
                                        .catch(function (err) {
                                            callback && callback(null, err);
                                        });
                            })
                            .catch(function(err){
                                callback && callback(null, err);
                            });
                    },

                    dropById: function(
                        nodeId,
                        callback/*function(succeeded, error)*/
                    ){
                        var nodeSchema = sequelize.model('fileSystem.node');

                        sequelize
                            .transaction({
                                autocommit: 'off',
                                isolationLevel: 'REPEATABLE READ'})
                            .then(function (t) {
                                nodeSchema.get(
                                    Number(nodeId),
                                    t,
                                    function(nodeInstance, err){
                                        if (err){
                                            if (t)
                                                t.rollback();
                                            callback && callback(false, err);
                                        }
                                        else{
                                            if (nodeInstance) {
                                                if (nodeInstance.isContainer){

                                                    var query =
                                                        'select * from "fileSystem"."dropContainerNode"(' +
                                                        (nodeId ? nodeId  : 'null') +
                                                        ');';

                                                    var callee = {
                                                        build: function (result, config) {
                                                            return result;
                                                        },
                                                        bulkBuild: function (result, config) {
                                                            return result;
                                                        }
                                                    };

                                                    var qqq = sequelize
                                                        .query(query, {transaction: t, model: callee});
                                                    /*
                                                    sequelize
                                                        .query(query, callee, {transaction: t}, [])
                                                    */
                                                    qqq
                                                        .catch(function(err){
                                                            t.rollback();
                                                            callback && callback(false, err);
                                                        })
                                                        .then(function (filesToDrop) {
                                                            if (filesToDrop) {
                                                                for (var f = 0; f < filesToDrop.length; f++){
                                                                    var fileToDrop = filesToDrop[f];
                                                                    var filePath =
                                                                        db.buildPath(
                                                                            fileToDrop.fileId,
                                                                            fileToDrop.folderPath,
                                                                            fileToDrop.repositoryLocation,
                                                                            false,
                                                                            fileToDrop.extension);

                                                                    fs.unlink(filePath, function (err) {
                                                                        if (err)
                                                                            console.log('failed removing file: '+ filePath);
                                                                    });
                                                                };

                                                                t.commit();
                                                                callback && callback(true, null);
                                                            }
                                                        });

                                                }
                                                else{
                                                    var file = nodeInstance.file;
                                                    var location = file.getLocation();
                                                    nodeInstance
                                                        .destroy({transaction: t})
                                                        .catch(function (err) {
                                                            t.rollback();
                                                            callback && callback(false, err);
                                                        })
                                                        .then(function (affectedRows) {
                                                            file
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
                                            }
                                            else
                                                callback && callback(null, null);
                                        }
                                    }
                                )
                            })
                            .catch(function (err) {
                                callback && callback(null, err);
                            });
                    },

                    rename: function(
                        nodeId,
                        newName,
                        callback/*function(succeeded, error)*/
                    ){
                        var nodeSchema = sequelize.model('fileSystem.node');

                        sequelize
                            .transaction({
                                autocommit: 'off',
                                isolationLevel: 'REPEATABLE READ'})
                            .then(function (t) {
                                nodeSchema.get(
                                    Number(nodeId),
                                    t,
                                    function(nodeInstance, err){
                                        if (err){
                                            if (t)
                                                t.rollback();
                                            callback && callback(false, err);
                                        }
                                        else{
                                            if (nodeInstance) {
                                                nodeInstance.name = newName;
                                                nodeInstance
                                                    .save({transaction: t})
                                                    .then(function (affectedRows) {
                                                        t
                                                            .commit()
                                                            .then(function(){
                                                                callback && callback(nodeInstance, null);
                                                            })
                                                            .catch(function (err) {
                                                                callback && callback(null, err);
                                                            });

                                                    })
                                                    .catch(function (err) {
                                                        t.rollback();
                                                        callback && callback(null, err);
                                                    });
                                            }
                                            else
                                                callback && callback(null, null);
                                        }
                                    }
                                )
                            })
                            .catch(function (err) {
                                callback && callback(null, err);
                            });
                    }
                }
            }
        );
    return definition;
};

function configure(getObjectHandler){
    var tree = getObjectHandler('tree', 'fileSystem');
    var node = getObjectHandler('node', 'fileSystem');
    var file = getObjectHandler('file', 'fileSystem');
    tree.hasOne(node, {as: 'tree', foreignKey : 'treeId'});
    node.hasOne(node, {as: 'parent', foreignKey : 'parentId'});
    file.hasOne(node, {as: 'file', foreignKey : 'fileId'});

    node.belongsTo(tree);
    node.belongsTo(file);
}


module.exports = {
    model: model,
    config: configure
};

