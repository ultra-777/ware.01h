const sourceFolder = './server';
const targetFolder = './dist/server';
const applicationFolder = 'application';
const modelsFolder = 'models';
const controllersFolder = 'controllers';
const commonFolder = 'common';
const routingFolder = 'routing';
const runFile = 'run.js';
const routingFileDefaultPrefix = 'default';
const routingFileTargetPrefix = 'routing';

var gulp = require('gulp'),
	uuid = require('uuid'),
	path = require('path'),
	common = require('../common/config.js'),
	rename = require('gulp-rename'),
	runSequence = require('run-sequence'),
	del = require('del');

function initGulp() {
	var uniqueKey = uuid.v4(),
		taskClearTarget = 'clear-target.' + uniqueKey,
		taskCopyApplication = 'copy-application.' + uniqueKey,
		taskCopyModels = 'copy-models.' + uniqueKey,
		taskCopyControllers = 'copy-controllers.' + uniqueKey,
		taskCopyCommon = 'copy-common.' + uniqueKey,
		taskCopyRun = 'copy-run.' + uniqueKey,
		taskCopyRouting = 'copy-routing.' + uniqueKey;

	gulp.task(taskClearTarget, [], function (cb) {
		return del([targetFolder], {force: true}, cb);
	});

	gulp.task(taskCopyApplication, [], function () {
		return gulp.src([sourceFolder + '/' + applicationFolder + '/**/*.*'])
			.pipe(gulp.dest(targetFolder + '/' + applicationFolder));
	});

	gulp.task(taskCopyModels, [], function () {
		return gulp.src([sourceFolder + '/' + modelsFolder + '/**/*.*'])
			.pipe(gulp.dest(targetFolder + '/' + modelsFolder));
	});

	gulp.task(taskCopyControllers, [], function () {
		return gulp.src([sourceFolder + '/' + controllersFolder + '/**/*.*'])
			.pipe(gulp.dest(targetFolder + '/' + controllersFolder));
	});

	gulp.task(taskCopyCommon, [], function () {
		return gulp.src([sourceFolder + '/' + commonFolder + '/**/*.*'])
			.pipe(gulp.dest(targetFolder + '/' + commonFolder));
	});

	gulp.task(taskCopyCommon, [], function () {
		return gulp.src([sourceFolder + '/' + commonFolder + '/**/*.*'])
			.pipe(gulp.dest(targetFolder + '/' + commonFolder));
	});

	gulp.task(taskCopyRouting, [], function () {
		common.initBuildEnvironment();
		return gulp.src([sourceFolder + '/' + routingFolder + '/' + (process.env.BUILD || routingFileDefaultPrefix) + '.js'])
			.pipe(rename(routingFileTargetPrefix + '.js'))
			.pipe(gulp.dest(targetFolder));
	});

	gulp.task(taskCopyRun, [], function () {
		return gulp.src([sourceFolder + '/' + runFile])
			.pipe(gulp.dest(targetFolder));
	});

	gulp.task('server-production', [], function (callback) {
		runSequence(
			taskClearTarget,
			taskCopyCommon,
			taskCopyApplication,
			taskCopyModels,
			taskCopyControllers,
			taskCopyRouting,
			taskCopyRun,
			callback
		);
	});

	gulp.task('default', ['development']);
};


module.exports =  initGulp;
