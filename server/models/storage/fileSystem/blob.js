"use strict";

var fs = require('fs');


function model(sequelize, DataTypes) {
    var definition =
        sequelize.define(
            "blob",
            {
                id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
                containerNodeId: { type: DataTypes.BIGINT, allowNull: false, validate: { isNumeric: true } },
                fileId: { type: DataTypes.BIGINT, allowNull: false, validate: { isNumeric: true } },
                totalSize: { type: DataTypes.BIGINT },
                chunkSize: { type: DataTypes.BIGINT },
                created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
            },
            {
                // don't add the timestamp attributes (updatedAt, createdAt)
                timestamps: false,

                schema: "fileSystem",

                // define the table's name
                tableName: 'Blob',

                hooks: {
                    beforeUpdate: function (blob, fn){
                        blob.onBeforeUpdate(blob, fn);
                    },
                    beforeCreate: function (blob, fn){
                        blob.onBeforeCreate(blob, fn);
                    },
                    beforeSave: function (blob, fn){
                        blob.onBeforeSave(blob, fn);
                    }
                },

                classMethods: {
                    get: function(
                        blobId,
                        theTransaction,
                        callback/*function(blob, error)*/
                    ){
                        var blobSchema = sequelize.model('fileSystem.blob');
                        var fileSchema = sequelize.model('fileSystem.file');
                        var folderSchema = sequelize.model('fileSystem.folder');
                        var repositorySchema = sequelize.model('fileSystem.repository');
                        var nodeSchema = sequelize.model('fileSystem.node');
                        var treeSchema = sequelize.model('fileSystem.tree');
                        var userSchema = sequelize.model('security.account');

                        blobSchema
                            .find({
                                where: { id: Number(blobId) },
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
                                        model: nodeSchema,
                                        as: 'containerNode',
                                        include: [{
                                            model: fileSchema,
                                            as: 'file'
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
                                    }
                                ],
                                transaction: theTransaction
                            })
                            .then(function(blob){
                                callback && callback(blob, null);
                            })
                            .catch(function(err){
                                callback && callback(null, err);
                            });
                    },

                    create: function(
                        repositoryName,
                        fileName,
                        parentNodeId,
                        totalSize,
                        chunkSize,
                        userId,
                        callback/*function(blob, error)*/){

                        var fileSchema = sequelize.model('fileSystem.file');
                        var blobSchema = sequelize.model('fileSystem.blob');


                        sequelize
                            .transaction({
                                autocommit: 'off',
                                isolationLevel: 'REPEATABLE READ'})
                            .then(function (t) {
                                fileSchema
                                    .create(
                                        repositoryName,
                                        fileName,
                                        totalSize,
                                        t,
                                        function(file, err){
                                            if (err){
                                                t.rollback();
                                                callback && callback(null, err);
                                            }
                                            else {
                                                if (file){
                                                    var newBlob =
                                                        blobSchema
                                                            .build({
                                                                fileId: file.id,
                                                                containerNodeId: parentNodeId,
                                                                totalSize: totalSize,
                                                                chunkSize: chunkSize
                                                            },
                                                            {transaction: t});
                                                    newBlob
                                                        .save({transaction: t})
                                                        .catch(function(err){
                                                            t.rollback();
                                                            callback && callback(null, err);
                                                        })
                                                        .then(function(newInstance){
                                                            t
                                                                .commit()
                                                                .catch(function(err){
                                                                    callback && callback(null, err);
                                                                })
                                                                .then(function() {
                                                                    if (newInstance)
                                                                        newInstance.file = file;
                                                                    callback && callback(newInstance, null);
                                                                });
                                                        })
                                                }
                                                else{
                                                    t.rollback();
                                                    callback && callback(null, null);
                                                }
                                            }
                                    });
                            })
                            .catch(function(err){
                                t.rollback();
                                callback && callback(null, err);
                            })
                    },

                    dropById: function(
                        blobId,
                        callback/*function(newNode, error)*/
                    ){
                        var blobSchema = sequelize.model('fileSystem.blob');
                        var nodeSchema = sequelize.model('fileSystem.node');

                        sequelize
                            .transaction({
                                autocommit: 'off',
                                isolationLevel: 'REPEATABLE READ'})
                            .then(function (t) {
                                    blobSchema.get(
                                        Number(blobId),
                                        t,
                                        function(blobInstance, err){
                                            if (err){
                                                if (t)
                                                    t.rollback();
                                                callback && callback(null, err);
                                            }
                                            else{
                                                if (blobInstance) {
                                                    blobInstance.flush();
                                                    var isOk = blobInstance.isOk;
                                                    var file = blobInstance.file;
                                                    var containerNode = blobInstance.containerNode;
                                                    blobInstance.destroy({transaction: t})
                                                        .then(function (affectedRows) {
                                                            if (isOk){
                                                                var newNode =
                                                                    nodeSchema
                                                                        .build({
                                                                            treeId: containerNode.treeId,
                                                                            isContainer: false,
                                                                            name: file.name,
                                                                            parentId: containerNode.id,
                                                                            fileId: file.id
                                                                        },
                                                                        {transaction: t});
                                                                newNode.file = file;
                                                                newNode
                                                                    .save({transaction: t})
                                                                    .then(function (affectedRows) {
                                                                        t
                                                                            .commit()
                                                                            .then(function(){
                                                                                callback && callback(newNode, null);
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
                                                            else{
                                                                file
                                                                    .destroy({transaction: t})
                                                                    .then(function (affectedRows) {
                                                                        t
                                                                            .commit()
                                                                            .then(function(){
                                                                                callback && callback(null, null);
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
                    },

                    dropInstance: function(
                        blobInstance,
                        callback/*function(newNode, error)*/
                    ){
                        var blobSchema = sequelize.model('fileSystem.blob');
                        var nodeSchema = sequelize.model('fileSystem.node');

                        sequelize
                            .transaction({
                                autocommit: 'off',
                                isolationLevel: 'REPEATABLE READ'})
                            .then(function (t) {
                                blobInstance.flush();
                                var isOk = blobInstance.isOk;
                                var file = blobInstance.file;
                                var containerNode = blobInstance.containerNode;
                                blobInstance.destroy({transaction: t})
                                    .then(function (affectedRows) {
                                        if (isOk){
                                            var newNode =
                                                nodeSchema
                                                    .build({
                                                        treeId: containerNode.treeId,
                                                        isContainer: false,
                                                        name: file.name,
                                                        parentId: containerNode.id,
                                                        fileId: file.id
                                                    },
                                                    {transaction: t});
                                            newNode.file = file;
                                            newNode
                                                .save({transaction: t})
                                                .then(function (affectedRows) {
                                                    t
                                                        .commit()
                                                        .then(function(){
                                                            callback && callback(newNode, null);
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
                                        else{
                                            file
                                                .destroy({transaction: t})
                                                .then(function (affectedRows) {
                                                    t
                                                        .commit()
                                                        .then(function(){
                                                            callback && callback(null, null);
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
                                    })
                                    .catch(function (err) {
                                        t.rollback();
                                        callback && callback(null, err);
                                    });
                            })
                            .catch(function (err) {
                                callback && callback(null, err);
                            });
                    }
                },

                instanceMethods: {

                    onBeforeCreate: function (blob, fn) {
                        return;
                    },

                    onBeforeUpdate: function (blob, fn) {
                        return;
                    },

                    onBeforeSave: function (blob, fn) {
                        return;
                    },

                    addChunk: function(index, data){
                        var binaryData = new Buffer(data, 'base64');
                        var startPosition = Number(this.chunkSize) * index;
                        var size = Number(this.chunkSize);
                        var expectedPosition = startPosition + size;
                        if (expectedPosition > this.totalSize){
                            size = this.totalSize - startPosition;
                            expectedPosition = startPosition + size;
                            if (size < 1)
                            return;
                        }

                        if (!this.fileStream){
                            this.fileStream = fs.openSync(this.getFilePath(), 'a');
                        }

                        fs.writeSync(this.fileStream, binaryData, 0, size, startPosition);

                        this.percent = expectedPosition / this.totalSize;

                        if (expectedPosition >= this.totalSize){
                            this.isOk = true;
                            this.percent = 1.0;
                            this.flush();
                        }
                    },

                    flush: function(){
                        if (this.fileStream != null) {
                            fs.fsyncSync(this.fileStream);
                            fs.closeSync(this.fileStream);
                            this.fileStream = null;
                        }
                    },

                    getFilePath: function(){
                        if (this.file)
                            return this.file.getLocation();
                        return null;
                    },

                    fileStream: null,

                    percent: 0.0,

                    isOk: false
                },

                setterMethods   : {
                    totalSize : function(newValue) {
                        this.setDataValue('totalSize', Number(newValue));
                    },
                    chunkSize : function(newValue) {
                        this.setDataValue('chunkSize', Number(newValue));
                    }
                }


            }
        );

    return definition;
};

function configure(getObjectHandler){
    var file = getObjectHandler('file', 'fileSystem');
    var node = getObjectHandler('node', 'fileSystem');
    var blob = getObjectHandler('blob', 'fileSystem');

    file.hasOne(blob, {as: 'file', foreignKey : 'fileId'});
    node.hasOne(blob, {as: 'containerNode', foreignKey : 'containerNodeId'});
    blob.belongsTo(file);
    blob.belongsTo(node, {as: 'containerNode'});
}

module.exports = {
    model: model,
    config: configure
};

