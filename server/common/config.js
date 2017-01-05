'use strict';

var uuid = require('uuid');
var process = require('process');
var path = require('path');
var fs = require('fs');
var _configuration = undefined;

const customConfigFileName = 'configuration.json';
const defaultConfiguration = {
	db: 'postgres://postgres:password@localhost:5432/ware.01h',
	host: process.env.HOST || '0.0.0.0',
	port: process.env.PORT || 80,
	portSsl: process.env.PORT_SSL || 443,
	storage: process.env.STORAGE_PATH || 'data',
	rootAlias: process.env.ROOT_ALIAS || '$',
	fileRepositoryName: 'file-system',
	fileRepositoryDefaultPath: './repository',
	repositoryChildFilesLimit: 256,
	repositoryChildFoldersLimit: 256,
	repositoryFileExtension: 'dat',
	sessionSecret: uuid.v4(),
	sessionExpirationTime: 1000 * 60 * 10,
	sessionUpdateTimeout: 1000 * 60,
	sessionCollection: 'sessions'
}

function loadConfiguration() {
	if (!_configuration) {
		var configuration = Object.assign({}, defaultConfiguration);
		var customConfigPath = path.join(__dirname, '../' + customConfigFileName);
		if (fs.existsSync(customConfigPath)) {
			var customConfig = require(customConfigPath);
			if (customConfig) {
				console.log('custom server configuration loaded');
				Object.keys(defaultConfiguration).forEach(function (key) {
					var customValue = customConfig[key];
					if (customValue !== undefined) {
						configuration[key] = customValue;
					}
				});
			}
		}
		_configuration = configuration;
	}
	return _configuration;
}

module.exports = loadConfiguration();
