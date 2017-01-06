const sourceFolder = './server';
const targetFolder = './dist/server';
const routingFolder = 'routing';
const routingFileDefaultPrefix = 'default';
const routingFileTargetPrefix = 'routing';
const gulpfileName = 'gulpfile.js';

var gulp = require('gulp'),
	uuid = require('uuid'),
	path = require('path'),
	common = require('../common/config.js'),
	rename = require('gulp-rename'),
	through = require('through2'),
	runSequence = require('run-sequence'),
	del = require('del');

function updateRoutingLinks() {
	return through.obj(
		function (chunk, enc, cb) {

			var currentStream = this;
			if (chunk.isNull()) {
				currentStream.push(chunk);
				return cb();
			}

			if (chunk.isBuffer()) {
				var source = chunk.contents.toString();
				source = source.replace(/..\/controllers/ig, './controllers');
				chunk.contents = new Buffer(source);
				currentStream.push(chunk);
				return cb();
			}
			cb();
		});
}

function initGulp() {
	var uniqueKey = uuid.v4(),
		taskClearTarget = 'clear-target.' + uniqueKey,
		taskCopyCommon = 'copy-common.' + uniqueKey,
		taskCopyRouting = 'copy-routing.' + uniqueKey;

	gulp.task(taskClearTarget, [], function (cb) {
		return del([targetFolder], {force: true}, cb);
	});

	gulp.task(taskCopyCommon, [], function () {
		return gulp.src([
			sourceFolder + '/**/',
			'!' + sourceFolder + '/' + routingFolder,
			'!' + sourceFolder + '/' + routingFolder + '/**',
			'!' + sourceFolder + '/' + gulpfileName
			])
			.pipe(gulp.dest(targetFolder));
	});

	gulp.task(taskCopyRouting, [], function () {
		common.initBuildEnvironment();
		return gulp.src([sourceFolder + '/' + routingFolder + '/' + (process.env.BUILD || routingFileDefaultPrefix) + '.js'])
			.pipe(updateRoutingLinks())
			.pipe(rename(routingFileTargetPrefix + '.js'))
			.pipe(gulp.dest(targetFolder));
	});

	gulp.task('server-production', [], function (callback) {
		runSequence(
			taskClearTarget,
			taskCopyCommon,
			taskCopyRouting,
			callback
		);
	});

	gulp.task('default', ['development']);
};


module.exports =  initGulp;
