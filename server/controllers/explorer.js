'use strict';

/**
 * Module dependencies.
 */

var multiparty = require("multiparty");
var fs = require('fs');
var db = require('../models/storage/db');
var treeImpl = require('../models/tree');
var result = require('../common/result');

var _blobSchema = undefined;
var _blobInstances = new Object();

function getBlobSchema() {
    if (!_blobSchema){
		_blobSchema = db.getObject('blob', 'fileSystem');
    }
    return _blobSchema;
}

exports.node = function(req, res, next) {
    checkAuthorization(req, res, function(){
        treeImpl.getInstance(null, req.user, function(instance, error){
            if (error)
                res.jsonp(result.failure(error.message));
            else{
                instance.getNode(req.body.id, function(node, error){

                    if (error)
                        res.jsonp(result.failure(error.message));
                    else
                        res.jsonp(result.success(node));
                });
            }
        })
    });
};


exports.root = function(req, res, next) {
    checkAuthorization(req, res, function(){
        treeImpl.getInstance(null, req.user, function(instance, error){
            if (error)
                res.jsonp(result.failure(error.message));
            else{
                instance.getRoot(function(folder, error){
                    if (error)
                        res.jsonp(result.failure(error.message));
                    else
                        res.jsonp(result.success(folder));
                });
            }
        })
    });
};

exports.newFolder = function(req, res, next) {
    checkAuthorization(req, res, function(){
        treeImpl.getInstance(null, req.user, function(instance, error){
            if (error)
                res.jsonp(result.failure(error.message));
            else{
                instance.newFolder(req.body.id, req.body.name, function(folder, error){
                    if (error)
                        res.jsonp(result.failure(error.message));
                    else
                        res.jsonp(result.success(folder));
                });
            }
        })
    });
};

exports.delete = function(req, res, next) {
    checkAuthorization(req, res, function(){
        treeImpl.getInstance(null, req.user, function(instance, error){
            if (error)
                res.jsonp(result.failure(error.message));
            else{
                instance.dropNode(req.body.id, function(resultFlag, error){
                    if (error)
                        res.jsonp(result.failure(error.message));
                    else{
                        res.jsonp(result.success(resultFlag));
                    }
                });
            }
        })
    });
};

exports.moveChild = function(req, res, next){
    checkAuthorization(req, res, function(){
        var parent = req.body.parentId;
        var child = req.body.childId;

        treeImpl.getInstance(null, req.user, function(instance, error){
            if (error)
                res.jsonp(result.failure(error.message));
            else{
                instance.moveChild(req.body.parentId, req.body.childId, function(resultFlag, error){
                    if (error)
                        res.jsonp(result.failure(error.message));
                    else{
                        res.jsonp(result.success(resultFlag));
                    }
                });
            }
        })
    });
}

exports.rename = function(req, res, next) {
    checkAuthorization(req, res, function(){
        treeImpl.getInstance(null, req.user, function(instance, error){
            if (error)
                res.jsonp(result.failure(error.message));
            else{
                instance.rename(req.body.id, req.body.newName, function(resultFlag, error){
                    if (error)
                        res.jsonp(result.failure(error.message));
                    else{
                        res.jsonp(result.success(resultFlag));
                    }
                });
            }
        })
    });
};

exports.download = function(req, res, next) {
    checkAuthorization(req, res, function(){
        treeImpl.getInstance(null, req.user, function(instance, error){
            if (error)
                res.status(500).send({ error: error, message: error.message });
            else{
                instance.downloadFile(req.query.id, function(fileName, stream, error){
                    if (error)
                        res.status(500).send({ error: error, message: error.message });
                    else{
                        res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
                        res.setHeader('Content-type', 'application/octet-stream');
                        stream.pipe(res);
                    }
                });
            }
        })
    });
};

exports.initBlob = function(req, res, next){
    checkAuthorization(req, res, function(){
		getBlobSchema()
            .create(
                req.body.fileName,
                req.body.folderId,
                req.body.totalSize,
                req.body.chunkSize,
                req.user,
                function(blob, error){
                    if (error)
                        res.jsonp(result.failure(error.message));
                    else{
                        if (blob)
                            res.jsonp(result.success({ id: blob.id }));
                        else
                            res.jsonp(result.success({ id: null }));
                    }
                });
    });
};

exports.addBlobChunk = function(req, res, next){
    checkAuthorization(req, res, function(){
        var cachedBlobInstance = _blobInstances[req.body.blobId];
        if (cachedBlobInstance){
            //console.log('--blob instance found: %s process: %d', req.body.blobId, process.pid);
            if (cachedBlobInstance.containerNode.tree.owner.id === req.user.id) {
                addChunk2Instance(
                    cachedBlobInstance,
                    req.body.chunkIndex,
                    req.body.data,
                    function (result) {
                        res.jsonp(result);
                    });
            }
            else
                res.send(404, 'instance is absent');
        }
        else {
            //console.log('--blob instance not found: %s process: %d', req.body.blobId, process.pid);

			getBlobSchema()
                .get(
                    req.body.blobId,
                    null,
                    function(blobInstance, error) {
                        if (error)
                            res.jsonp(result.failure(error.message));
                        else {
                            if (blobInstance) {

                                if (blobInstance.containerNode.tree.owner.id === req.user.id) {

                                    _blobInstances[req.body.blobId] = blobInstance;

                                    addChunk2Instance(
                                        blobInstance,
                                        req.body.chunkIndex,
                                        req.body.data,
                                        function (result) {
                                            res.jsonp(result);
                                        });
                                }
                                else
                                    res.jsonp(result.failure('instance is absent'));
                            }
                            else
                                res.jsonp(result.failure('instance is absent'));
                    }
                });
        }
    });
}

function addChunk2Instance(blobInstance, chunkIndex, data, callback){

    if (blobInstance) {
        blobInstance.addChunk(
            chunkIndex,
            data);

        var result =
        {
            id: blobInstance.id,
            percent: blobInstance.percent,
            isComplete: blobInstance.isOk
        };

        if (blobInstance.isOk) {

            dropBlob(blobInstance.id, function (newNode, error) {

                if (newNode)
                    result.file = treeImpl.getFileInfo(newNode);

                callback(result);
            });
            return;
        };
        callback(result);
    }
    else
        callback(null);
}

function dropBlob(id, callback){

    var existingInstance = _blobInstances[id];
    if (existingInstance) {
        delete _blobInstances[id];
    }

    var handler = function(newNode, err) {
        if (err)
            callback && callback(null, err);
        else {
            callback && callback(newNode, null);
        }
    };

    if (existingInstance)
		getBlobSchema().dropInstance(existingInstance, handler);
    else
		getBlobSchema().dropById(id, handler);

    existingInstance = null;
}

exports.releaseBlob = function(req, res, next){
    checkAuthorization(req, res, function() {

		getBlobSchema()
            .get(
            req.body.blobId,
            null,
            function (blobInstance, error) {
                if (error)
                    res.jsonp(result.failure(error.message));
                else {
                    if (blobInstance) {

                        if (blobInstance.containerNode.tree.owner.id === req.user.id) {
                            dropBlob(req.body.blobId, function (result, err) {
                                res.jsonp(result);
                            });
                        }
                        else
                            res.jsonp(result.failure('instance is absent'));
                    }
                }
            });
    })
}

exports.uploadFile = function(req, res, next){

    var form = new multiparty.Form();

    var dataLength = null;
    var parentNodeId = null;
    var repositoryBlob = null;

// Parts are emitted when parsing the form
    form.on('part', function(part) {
        if ((part.filename === undefined) || (part.filename === null)) {

            parentNodeId = Number(part.name);
            part.resume();
        }
        else{
            console.log('got field named ' + part.name);
            // ignore file's content here

            var nodeSchema = db.getObject('node', 'fileSystem');
            nodeSchema
                .get(parentNodeId, null, function(parentNode, error){
                    if (error)
                        res.jsonp(result.failure(error.message));
                    else{
                        if (parentNode){
                            dataLength = part.byteCount;
							getBlobSchema()
                                .create(
                                    null,
                                    part.filename,
                                    parentNode.id,
                                    part.byteCount,
                                    part.byteCount,
                                    req.user,
                                    function(blob, error){
                                        if (error)
                                            res.jsonp(result.failure(error.message));
                                        else{
                                            repositoryBlob = blob;
                                            repositoryBlob.containerNode = parentNode;
                                            var location = blob.file.getLocation();
                                            var out = fs.createWriteStream(location);
                                            part.pipe(out);
                                        }
                                    });
                        }
                    }
                });
            }
    });

    form.on('error', function(err) {
        console.log('Upload error!' + err);

        release();

        res.jsonp(result.failure('Upload error! ' + JSON.stringify(error)));

    });

    form.on('aborted', function() {
        console.log('Upload aborted!');

        release();

        res.jsonp(result.failure('Upload aborted'));

    });

    form.on('close', function() {
        console.log('Upload completed!');
        repositoryBlob.isOk = true;
        release(res);
    });

    function release(res){
        if (repositoryBlob) {
			getBlobSchema()
                .dropInstance(repositoryBlob, function (newNode, error) {
                    if (res) {
                        if (error)
                            res.jsonp(result.failure(error.message));
                        else
                            res.jsonp(result.success(treeImpl.getFileInfo(newNode)));
                    }
                    repositoryBlob = null;
                });
        }
    }

    form.parse(req);
}

function checkAuthorization(req, res, callback/*function()*/){

    //callback && callback();
    // return;
    if (req.user) {
        callback && callback();
    }
    else {
        res.send(401, {
            message: 'User is not signed in'
        });
    }
}
