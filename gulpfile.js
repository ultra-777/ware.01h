(function () {
    'use strict';


    var gulp = require('gulp'),
        sequence = require('run-sequence'),
        initClient = require('./client/gulpfile.js'),
        client = new initClient();

    function getUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    };

}());
