'use strict';

var configuration = require('./../controllers/configuration');

var core = require('./../controllers/core');
var explorer = require('./../controllers/explorer');
var repository = require('./../controllers/repository');

var security = require('./../controllers/security');
var smtp = require('./../controllers/smtp');

 var update = require('./../controllers/update');


module.exports = function(app) {

	app.route('/configuration/applicationSettings').get(configuration.applicationSettings);
	app.route('/configuration/language').get(configuration.language);


	app.route('/home/userInfo').get(core.userInfo);

	app.route('/explorer').get(explorer.root);
	app.route('/explorer/root').post(explorer.root);
	app.route('/explorer/node').post(explorer.node);
	app.route('/explorer/moveChild').post(explorer.moveChild);
	app.route('/explorer/newFolder').post(explorer.newFolder);
	app.route('/explorer/delete').post(explorer.delete);
	app.route('/explorer/rename').post(explorer.rename);
	app.route('/explorer/download').get(explorer.download);
	app.route('/explorer/initBlob').post(explorer.initBlob);
	app.route('/explorer/addBlobChunk').post(explorer.addBlobChunk);
	app.route('/explorer/releaseBlob').post(explorer.releaseBlob);
	app.route('/explorer/uploadFile').post(explorer.uploadFile);

	app.route('/repository/find').post(repository.find);
	app.route('/repository/get').post(repository.get);
	app.route('/repository/update').post(repository.update);
	app.route('/repository/create').post(repository.create);
	app.route('/repository/delete').post(repository.delete);

	app.route('/security/getSessionInfo').post(security.getSessionInfo);
	app.route('/security').put(security.update);

	app.route('/security/signup').post(security.signup);
	app.route('/security/signin').post(security.signin);
	app.route('/security/signout').post(security.signout);

	app.param('userId', security.userByID);

	app.route('/__/send').post(smtp.send);

	app.route('/update/pull').post(update.pull);
	app.route('/update/install').post(update.install);
	app.route('/update/build').post(update.build);
	app.route('/update/restart').post(update.restart);

};
