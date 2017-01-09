(function () {
	'use strict';
	function gulpConfig() {

		var temp,
            rootFolderName,
			sourcesRoot,
			node_modules,
			scripts,
			libs,
			mainAotFileName,
			modulesFolderName,
			commonConfig = require('../common/config'),
			wwwRoot = this;

		var targetFilesFolderName = 'files',
            targetApplicationFileName = 'application.js',
            targetApplicationMapFileName = 'application.js.map',
            targetApplicationStylesFileName = 'application.css',
            targetVendorsFileName = 'vendors.js',
            targetVendorsMapFileName = 'vendors.js.map',
			indexFileName = 'index.html';

		wwwRoot.target = {
			root: commonConfig.targetRoot,
			files: commonConfig.targetRoot + '/' + targetFilesFolderName,
			filesFolderName: targetFilesFolderName,
			applicationFileName: targetApplicationFileName,
			applicationMapFileName: targetApplicationMapFileName,
			stylesFileName: targetApplicationStylesFileName,
			vendorsFileName: targetVendorsFileName,
            vendorsMapFileName: targetVendorsMapFileName,
			indexFileName: indexFileName,
			libsFolderName: 'libs',
			appFolderName: 'app',
			fontFolderName: 'fonts'
		};

        rootFolderName = 'client';
		mainAotFileName = 'main-aot.ts';
		modulesFolderName = 'modules';
        sourcesRoot = './' + rootFolderName;
        node_modules = './node_modules';
        libs = './libs';
        scripts = '../scripts';
		temp = './temp';

		wwwRoot.temp = {
			root: temp,
			libs: temp + '/libs',
			application: temp + '/app',
			modules: temp + '/app/' + modulesFolderName,
			ts: [
                temp + '/app/**/*.ts'
			],
			cleanPath: [
                temp
			]
		};


		wwwRoot.common = {
            rootFolderName: rootFolderName,
			mainAotFileName: mainAotFileName
		};

		wwwRoot.source = {
			root: sourcesRoot,
			application: sourcesRoot + '/app',
			libs: libs,
			bootstrap: sourcesRoot + '/bootstrap.ts',
			favicon: [sourcesRoot + '/favicon.ico'],
			appGrain: sourcesRoot + '/app_grain.png',
			index: sourcesRoot + '/index.html',
			index_production: sourcesRoot + '/index_production.html',
			cleanPath: [
				sourcesRoot + '/*.js'
			],
			ts: [
				sourcesRoot + '/app/**/*.ts'
			],
			templates: [
				sourcesRoot + '/app/**/*.html'
			],
			icons: [
				sourcesRoot + '/*/**/*.png',
				sourcesRoot + '/*/**/*.gif',
				sourcesRoot + '/*/**/*.tiff'
			],
			less: [
				sourcesRoot + '/less/application.less',
				sourcesRoot + '/app/**/*.less'
			],
			vendors: {
				development: {
					js: [
						node_modules + '/reflect-metadata/Reflect.js',
						node_modules + '/intl/dist/Intl.js',
						node_modules + '/intl/locale-data/jsonp/en.js',
						node_modules + '/core-js/client/shim.js',
						node_modules + '/zone.js/dist/zone.js',
						node_modules + '/jquery/dist/jquery.js',
					]
				},
				production: {
					js: [
						node_modules + '/reflect-metadata/Reflect.js',
						node_modules + '/intl/dist/Intl.min.js',
						node_modules + '/intl/locale-data/jsonp/en.js',
						node_modules + '/core-js/client/shim.min.js',
						node_modules + '/zone.js/dist/zone.min.js',
						node_modules + '/jquery/dist/jquery.min.js',
					]
				},
				css: [
					// libs + '/bootstrap/css/**/*.css',
				],
				fonts: [
				],
				common: [
					// node_modules + '/reflect-metadata/Reflect.js.map',
				]
			}
		};

		wwwRoot.publish = {
		}

	}
	module.exports = new gulpConfig();
}());

