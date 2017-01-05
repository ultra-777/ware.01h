
var fs = require('fs');
var db = require('./storage/db');
var exp = require('./explorer.js');
var config = require('../common/config');

var getFileInfo = function(node){
    var file = new exp.file();
    file.id = node.id;
    file.parent = node.parentId;
    file.name = node.name;
    if (node.file){
        file.extension = node.file.extension;
        file.size = node.file.size;
        file.created = node.file.created;
    }
    return file;
}

getInstance = function(id, user, callback/*function(instance, error)*/){

    var instance = function(treeInstance){

        var tree = treeInstance;

        this.getRoot = function(callback/*function(folder, error)*/){

            var nodeSchema = db.getObject('node', 'fileSystem');
            nodeSchema
                .find(
                    {
                        treeId: tree.id,
                        isContainer: true,
                        parentId: null
                    }
                )
                .catch(function(err){
                    callback && callback (null, err);
                })
                .then(function(node) {
                    if (node)
                        getFolderInfo(node, true, callback);
                    else {
                        var newNode = nodeSchema.build();
                        newNode.treeId = tree.id;
                        newNode.isContainer = true;
                        newNode.name = config.rootAlias;
                        newNode
                            .save()
                            .catch(function(err){
                                callback && callback(null, err);
                            })
                            .then(function(){
                                getFolderInfo(newNode, true, callback);
                            });
                    }
                });
        };

        this.getNode = function(nodeId, callback/*function(node, error)*/) {
            var nodeSchema = db.getObject('node', 'fileSystem');
            var fileSchema = db.getObject('file', 'fileSystem');
            nodeSchema
                .find({
                    where: {id: nodeId},
                    include: [{model: fileSchema, as: 'file'}]
                })
                .then(function(node) {
                    if (node.isContainer)
                        getFolderInfo(node, true, callback);
                    else
                        callback && callback(getFileInfo(node), null);
                })
                .catch(function(err){
                    callback && callback (null, err);
                });
        };

        this.moveChild = function(parentId, childId, callback /*function(result, error)*/ ){
            var nodeSchema = db.getObject('node', 'fileSystem');
            nodeSchema
                .moveChild(parentId, childId, callback);
        }

        var getFolderInfo = function(node, withChildren, callback/*function(folder, error)*/) {

            var folder = new exp.folder();
            folder.name = node.name;
            folder.id = node.id
            folder.parent = node.parentId;

            if (withChildren){
                var nodeSchema = db.getObject('node', 'fileSystem');
                var fileSchema = db.getObject('file', 'fileSystem');
                nodeSchema
                    .findAll(
                    {
                        where: {treeId: tree.id, parentId: node.id},
                        include: [{model: fileSchema, as: 'file'}]
                    })
                    .catch(function(err){
                        callback && callback (null, err);
                    })
                    .then(function(children) {
                        if (children) {
                            for (var i in children){
                                var child = children[i];
                                folder.children.push({
                                    id: child.id,
                                    name: child.name,
                                    isContainer: child.isContainer
                                });
                                /*
                                if (child.isContainer) {
                                    getFolderInfo(child, false, function (childFolder, err) {
                                        folder.children.push(childFolder);
                                    });
                                }
                                else{
                                    folder.children.push(getFileInfo(child));
                                }
                                */
                            }
                            callback && callback(folder, null);
                        }
                    });
                return;
            }

            callback && callback(folder, null);
        }

        this.newFolder = function(parentFolderId, name, callback/*function(folder, error)*/){
            var nodeSchema = db.getObject('node', 'fileSystem');
            nodeSchema
                .find(
                {
                    treeId: tree.id,
                    isContainer: true,
                    id: parentFolderId
                })
                .catch(function(err){
                    callback && callback (null, err);
                })
                .then(function(parentNode) {
                    if (parentNode){
                        var newNode = nodeSchema.build();
                        newNode.treeId = tree.id;
                        newNode.isContainer = true;
                        newNode.name = name;
                        newNode.parentId = parentFolderId;
                        newNode
                            .save()
                            .catch(function(err){
                                callback && callback(null, err);
                            })
                            .then(function(){
                                getFolderInfo(newNode, true, callback);
                            })
                    }
                    else
                        callback && callback(null, null);
                });
        };

        this.downloadFile = function(nodeId, callback/*function(fileName, stream, error)*/){

            var nodeSchema = db.getObject('node', 'fileSystem');

            nodeSchema
                .get(
                    nodeId,
                    null,
                    function(node, err){
                        if (err)
                            callback && callback(null, err);
                        else{
                            if (node && node.file){
                                var location = node.file.getLocation();
                                var stream = fs.createReadStream(location);
                                callback && callback(node.name, stream, null);
                            }
                            else
                                callback && callback(null, 'Not found');
                        }
                    }
            );
        };

        this.dropNode = function(nodeId, callback/*function(succeeded, error)*/){

            var nodeSchema = db.getObject('node', 'fileSystem');
            nodeSchema
                .dropById(nodeId, function(succeeded, error){
                    callback && callback(succeeded, error);
                });
        };

        this.rename = function(nodeId, newName, callback/*function(succeeded, error)*/){

            var nodeSchema = db.getObject('node', 'fileSystem');
            nodeSchema
                .rename(nodeId, newName, function(succeeded, error){
                    callback && callback(succeeded, error);
                });
        };
    };


    var treeSchema = db.getObject('tree', 'fileSystem');
    var repositorySchema = db.getObject('repository', 'fileSystem');
    var promise =
        id ?
            treeSchema
                .find({
                    where: {id: id, ownerId: user.id},
                    include: [
                        { model: repositorySchema, as: 'repository' }
                    ]
                }) :
            treeSchema
                .find({
                    where: {ownerId: user.id},
                    include: [
                        { model: repositorySchema, as: 'repository' }
                    ]
                });
    promise
        .then(function(tree){
            if (tree)
                callback && callback (new instance(tree));
            else{

                repositorySchema
                    .find({
                        where: ['"isOpen" = ?', true]
                    })
                    .catch(function(err){
                        callback && callback (null, err);
                    })
                    .then(function(repository) {
                        if (repository){
                            var newTree = treeSchema.build();
                            newTree.repositoryId = repository.id;
                            newTree.ownerId = user.id;
                            newTree
                                .save()
                                .then(function(){
                                    callback && callback (new instance(newTree));
                                })
                                .catch(function(err){
                                    callback && callback (null, err);
                                })
                        }
                        else
                            callback && callback (null);
                    });

            }
        })
        .catch(function(err){
            callback && callback (null, err);
        });

};

module.exports = {
    getInstance: getInstance,
    getFileInfo: getFileInfo
};
