'use strict';

/**
 * Module dependencies.
 */

var pth = require('path');
var config = require('../common/config');

function cutBeginning(source, template){
    if(source.indexOf(template) === 0){
        return source.substring(template.length);
    }
    return source;
}

function path2local(candidate){
    //console.log(candidate);
    if (candidate === null)
        return null;
    if ((candidate === '') || (candidate === '.'))
        return config.storage;

    candidate = cutBeginning(candidate, config.rootAlias);

    return pth.join(config.storage, candidate);
}

function path2relative(path){
    var relativePath = cutBeginning(path, config.storage);
    return pth.join(config.rootAlias, relativePath);
}

function getParentFromPath(path){
    var parentPath = pth.dirname(path);
    if (parentPath === '.')
        return null;
    return parentPath;
}

function join2pathsOfPath(part1, part2){
    return pth.join(part1, part2);
}

function getFileNameFromPath(fullPath){
    return pth.basename(fullPath);
}

// export the class

module.exports = {
    pathToLocal: path2local,
    pathToRelative: path2relative,
    getParent: getParentFromPath,
    joinPath: join2pathsOfPath,
    getFileName: getFileNameFromPath
};






