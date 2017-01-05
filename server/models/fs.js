'use strict';

/**
 * Module dependencies.
 */


var fs = require('fs');
var exp = require('./explorer.js');
var map = require('./map.js');
var pth = require('path');
var common = require('./common');

var rootPath = map.pathToLocal('');
if (!fs.existsSync(rootPath))
    fs.mkdirSync(rootPath, common.accessPermission);

function getFile(path, stat){

    var fileName = map.getFileName(path);

    var result = new exp.file();
    result.Id = map.pathToRelative(path);
    result.Parent = map.getParent(path);
    result.Name = fileName;
    result.Size = stat.size;

    return result;
}

function getFolder(path, withChildren) {

    var relativePath = map.pathToRelative(path);
    var folderName = map.getFileName(relativePath);

    var result = new exp.folder();
    result.name = folderName;
    result.id = relativePath;
    result.parent = map.getParent(path);

    if (withChildren === true) {
        var dirContents = fs.readdirSync(path);

        for (var itemIndex in dirContents) {
            var item = dirContents[itemIndex];
            var itemPath = map.joinPath(path, item);
            if (fs.existsSync(itemPath)) {
                var stat = fs.statSync(itemPath);
                if (stat.isDirectory()) { //conditing for identifying containers
                    result.Children.push(getFolder(itemPath, false));
                }
                else {
                    result.Children.push(getFile(itemPath, stat));
                }
            }
        }
    }
    return result;
}

function getItem(pathCandidate) {

    console.log(pathCandidate);
    var path = map.pathToLocal(pathCandidate);


    if (fs.existsSync(path)){
        var stat = fs.statSync(path);
        if (stat.isDirectory()){
            return getFolder(path, true);
        }
        else{
            return getFile(path, stat);
        }
    }
    return null;
}

function newFolder(parentFolderId, name)
{
    var path = map.pathToLocal(parentFolderId);
    if (fs.existsSync(path)) {
        var newPath = map.joinPath(path, name);
        if (!fs.existsSync(newPath)) {
            fs.mkdirSync(newPath, common.accessPermission);
            return getFolder(newPath, true);
        }
    }
    return null;
}

function deleteItem(path)
{
    var path = map.pathToLocal(path);
    if (fs.existsSync(path)) {
        var stat = fs.statSync(path);
        if (stat.isDirectory()){
            dropDirectory(path);
        }
        else{
            fs.unlink(path);
        }
        return true;
    }
    return false;
}

function dropDirectory(path) {
    var list = fs.readdirSync(path);
    for(var i = 0; i < list.length; i++) {
        var item = pth.join(path, list[i]);
        var stat = fs.statSync(item);
        if(item == "." || item == "..") {
            // pass these leafs
        } else if(stat.isDirectory()) {
            // rmdir recursively
            dropDirectory(item);
        } else {
            fs.unlinkSync(item);
        }
    }
    fs.rmdirSync(path);
};



function downloadFile(path, res){
    path = map.pathToLocal(path);

    var filename = map.getFileName(path);

    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-type', 'application/octet-stream');

    var fileStream = fs.createReadStream(path);
    fileStream.pipe(res);
}

// export the class

module.exports.GetItem = getItem;

module.exports.NewFolder = newFolder;

module.exports.Delete = deleteItem;

module.exports.Download = downloadFile;










