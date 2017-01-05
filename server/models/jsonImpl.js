'use strict';

/**
 * Module dependencies.
 */

var toString = require('../common/stringify');


function jsonImpl() {
    this.toJson = function() {

        return toString(this);

    };
}

module.exports.jsonImpl = jsonImpl;

