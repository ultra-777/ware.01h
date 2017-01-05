'use strict';

/**
 * Module dependencies.
 */

var util = require('./jsonImpl.js');

var rootFolderAlias = '$';

function itemIndex() {
    // always initialize all instance properties
    /*jshint validthis:true */
    this.id = '';
}

itemIndex.prototype = new util.jsonImpl();

function item() {
    // always initialize all instance properties
    /*jshint validthis:true */
    this.isContainer = false;
    /*jshint validthis:true */
    this.name = '';
    /*jshint validthis:true */
    this.parent = '';
}

item.prototype = new itemIndex();

function folder() {
    /*jshint validthis:true */
    this.isContainer = true;
    /*jshint validthis:true */
    this.children = [];
}
folder.prototype = new item();


function file() {
    /*jshint validthis:true */
    this.extension = '';
    /*jshint validthis:true */
    this.size = 0;
    /*jshint validthis:true */
    this.created = null;
}

file.prototype = new item();

// export the class
module.exports.folder = folder;

module.exports.file = file;

module.exports.rootAlias = rootFolderAlias;

