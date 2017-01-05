
var fs = require('fs');
var db = require('./storage/db');
var util = require('./jsonImpl.js');


function repositoryInstance(source) {
    this.id = source.id,
    this.name = source.name,
    this.location = source.location,
    this.isOpen = source.isOpen,
    this.childFilesLimit = source.childFilesLimit,
    this.childFoldersLimit = source.childFoldersLimit,
    this.created = source.created
}

repositoryInstance.prototype = new util.jsonImpl();

function findInstances (name, callback/*function(instance, error)*/) {

    var repositorySchema = db.getObject('repository', 'fileSystem');
    repositorySchema.findInstance(name, function(instances, error){
        if (error){
            callback && callback (null, error);
        }
        else {
            if (instances == null){
                callback && callback (null, null);
            }
            else {
                var result = [];
                instances.forEach(function(instance){
                    result.push( new repositoryInstance(instance));
                });
                callback && callback (result, error);
            }
        }
    });
}

function getInstance (id, callback/*function(instance, error)*/) {
    var repositorySchema = db.getObject('repository', 'fileSystem');
    repositorySchema.get(id, function(instance, error) {
        callback && callback ((instance ? new repositoryInstance(instance) : null), error);
    });
}

function updateInstance (id, name, location, isOpen, callback/*function(instance, error)*/) {

    var repositorySchema = db.getObject('repository', 'fileSystem');
    repositorySchema.update(id, name, location, isOpen, function(instance, error){
        callback && callback ((instance ? new repositoryInstance(instance) : null), error);
    });
}

function createInstance (name, location, isOpen, callback/*function(instance, error)*/) {
    var repositorySchema = db.getObject('repository', 'fileSystem');
    repositorySchema.create(name, location, isOpen, function(instance, error){
        callback && callback ((instance ? new repositoryInstance(instance) : null), error);
    });
}

function deleteInstance (id, callback/*function(instance, error)*/) {
    var repositorySchema = db.getObject('repository', 'fileSystem');
    repositorySchema.delete(id, callback);
}


module.exports = {
    find: findInstances,
    get: getInstance,
    update: updateInstance,
    create: createInstance,
    delete: deleteInstance
};
