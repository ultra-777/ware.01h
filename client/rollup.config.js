(function () {
    'use strict';

    var config = require('../common/config.js'),
        rollup = require('rollup'),
        nodeResolve = require('rollup-plugin-node-resolve'),
        commonjs = require('rollup-plugin-commonjs'),
        uglify = require('rollup-plugin-uglify'),
        progress = require('rollup-plugin-progress'),
        process = require('process');

    function getPlugins(){
        var plugins = [];
        plugins.push(nodeResolve({jsnext: true, module: true}));
        plugins.push(commonjs({
            include: ['node_modules/rxjs/**', 'node_modules/moment/**']
        }));
        if (process.env.ENV_NODE === config.ENV_PRODUCTION) {
            plugins.push(uglify());
        }
        return plugins;
    }

    module.exports = {
        entry: './temp/app/main.js',
        dest: config.targetRoot + '/application.js',
        sourceMap: (process.env.ENV_NODE === config.ENV_DEVELOPMENT) ? true : false,
        format: 'iife',
        context: 'window',
        plugins: getPlugins()
    }
}());
