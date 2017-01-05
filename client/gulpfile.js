/// <binding />
(function () {
	'use strict';

	var common = require('./../common/config.js'),
        gulp = require('gulp'),
		del = require('del'),
		tsLint = require('gulp-tslint'),
    	tsLintConfig = require("./tslint.json"),
		less = require('gulp-less'),
		inject = require('gulp-inject'),
		cleanCss = require('gulp-clean-css'),
		concatCss = require('gulp-concat-css'),
		uglifyJs = require('gulp-uglify'),
		inlineNg2Template = require('gulp-inline-ng2-template'),
		runSequence = require('run-sequence'),
		gulpConcat = require('gulp-concat'),
		gulpReplace = require('gulp-replace'),
		htmlMin = require('gulp-htmlmin'),
		childProc = require('child_process').exec,
		os = require('os'),
		queue = require('streamqueue'),
        htmlbuild = require('gulp-htmlbuild'),
        md5File = require('md5-file'),
        htmlMinifier = require('html-minifier'),
        sourcemaps = require('gulp-sourcemaps'),
        through = require('through2'),
        nodePath=require('path'),
        nodeFs = require('fs'),
        sourceRegExp = /(["'])([^"']+.(jpe?g|bmp|gif|tiff|png|svg|ttf|eot|woff|woff2|otf))(["'])/ig,
        sourceRegExp2 = /(url\()([^"']+.(jpe?g|bmp|gif|tiff|png|svg|ttf|eot|woff|woff2|otf))(\))/ig,
        matchPathIndex = 2,
        matchExtensionIndex = 3,
        templateRegExp = /template:\s+"(.+)"/ig,
        matchContentIndex = 1,
        process = require('process'),
		uuid = require('uuid'),
		config = require('./gulp.config.js');

	function getFileHash(filePath){
        return nodeFs.existsSync(filePath) ? md5File.sync(filePath) : '';
    }

    function ensureCreateDirectory(path){
        var normalPath = nodePath.normalize(path);
        var parts = normalPath.split(nodePath.sep);
        if (parts.length > 1){
            parts.splice(parts.length - 1, 1);
            var previousPath = parts.join(nodePath.sep);
            ensureCreateDirectory(previousPath);
        }
        if (!nodeFs.existsSync(normalPath)) {
            nodeFs.mkdirSync(normalPath);
        }
    }

    function ensureTargetFilesDirectory() {
	    var normalPath = nodePath.normalize(config.target.files);
        ensureCreateDirectory(normalPath);
    }

	function applyBuildModuleTemplate(postfix) {
		return through.obj(
			function (chunk, enc, cb) {

				var currentStream = this;
				var buildConfiguration = process.env.BUILD;
				if (chunk.isNull() || !buildConfiguration) {
					currentStream.push(chunk);
					return cb();
				}

				if (chunk.isBuffer()) {
					var source = chunk.contents.toString();
					var defaultModuleName = common.targetModulePrefix + postfix;
					var regexp = new RegExp(defaultModuleName, 'i');
					var match = regexp.exec(source);
					if (match) {
						var newBuildModule = buildConfiguration + postfix;

						source = source.replace(defaultModuleName, newBuildModule);
						console.log('build module: ' + defaultModuleName + ' => ' + newBuildModule);
					}

					chunk.contents = new Buffer(source);
					currentStream.push(chunk);
					return cb();
				}
				cb();
			});
	}

    function handleSwapExpression(regExp, folder, relativePath, sourceContent) {
        var match;
        while ((match = regExp.exec(sourceContent)) !== null) {
            var sourcePath = match[matchPathIndex];
            var currentPath = nodePath.join(folder, sourcePath);
            var hash = getFileHash(currentPath);
            if (hash) {
                var newFileName = hash + '.' + match[matchExtensionIndex];
                var newFilePath = nodePath.join(config.target.files, newFileName);
                var newRelativePath = './' + config.target.filesFolderName + '/' + newFileName;
                if (!nodeFs.existsSync(newFilePath)) {
                    nodeFs.writeFileSync(newFilePath, nodeFs.readFileSync(currentPath));
                }
                sourceContent = sourceContent.replace(sourcePath, newRelativePath);
                console.log(relativePath + ': ' + sourcePath + ' => ' + newRelativePath);
            }
            else {
                console.log(relativePath + ': ' + sourcePath + ' => NOT FOUND');
            }
        }
        return sourceContent;
    }

    function swapImagePath(sourcePath, sourceContent) {
        var folder = nodePath.dirname(sourcePath);
        var relativePath = sourcePath.replace(__dirname, '');
        sourceContent = handleSwapExpression(sourceRegExp, folder, relativePath, sourceContent);
        sourceContent = handleSwapExpression(sourceRegExp2, folder, relativePath, sourceContent);
        return sourceContent;
    }

    function clearCompiledTemplates() {
        return through.obj(
            function (chunk, enc, cb) {

                var currentStream = this;
                if (chunk.isNull()) {
                    currentStream.push(chunk);
                    return cb();
                }

                if (chunk.isBuffer()) {
                    var source = chunk.contents.toString();
                    var relativePath = chunk.path.replace(chunk.cwd, '');
                    var match;
                    while ((match = templateRegExp.exec(source)) !== null) {
                        var sourceContent = match[matchContentIndex];
                        source = source.replace(sourceContent, '');
                        console.log(relativePath + ': ' + 'template is down');
                    }

                    chunk.contents = new Buffer(source);
                    currentStream.push(chunk);
                    return cb();
                }
                cb();
            });
    }

    function mergeTemplates(justClearTemplate) {
	    if (!justClearTemplate) {
            ensureTargetFilesDirectory();
        }
        return queue({objectMode: true},
            gulp.src(config.source.ts),
            gulp.src(config.source.templates)
                .pipe(htmlMin({collapseWhitespace: true, caseSensitive: true}))
        ).pipe(inlineNg2Template({
            base: config.temp.root,
            removeLineBreaks: true,
            indent: 0,
            useRelativePaths: true,
            target: 'es5',
            templateProcessor: function (path, ext, file, callback) {

                if (justClearTemplate || !file) {
                    callback(null, '<br>');
                }
                else {
                    file = swapImagePath(path, file);
                    try {
                        var minifiedFile = htmlMinifier.minify(file, {
                            collapseWhitespace: true,
                            caseSensitive: true,
                            removeComments: true,
                            removeRedundantAttributes: true
                        });
                        callback(null, minifiedFile);
                    }
                    catch (err) {
                        callback(err);
                    }
                }
            }
        })).pipe(gulp.dest(config.temp.application));
    };




    function initGulp() {
		var uniqueKey = uuid.v4(),
            taskInitDevelopmentEnvironment = 'init-development-environment.' + uniqueKey,
            taskInitProductionEnvironment = 'init-production-environment.' + uniqueKey,
			taskCleanAppJs = 'clean-app-js.' + uniqueKey,
			taskCleanAppCss = 'clean-app-css.' + uniqueKey,
            taskCleanAppFiles = 'clear-app-files.' + uniqueKey,
            taskCleanVendors = 'clear-app-vendors.' + uniqueKey,
        	taskClearTemp = 'clear-temp.' + uniqueKey,
            taskClearTemplates = 'clear-templates.' + uniqueKey,
        	taskApplicationMergeTemplates = 'application-merge-templates.' + uniqueKey,
            taskApplicationClearTemplates = 'application-clear-templates.' + uniqueKey,
            taskMoveTsConfig = 'move-ts-config__.' + uniqueKey,
			taskUpdateMainWithBuild = 'update-main-with-build.' + uniqueKey,
        	taskNgc = 'ngc.' + uniqueKey,
        	taskTsLint = 'tsLint.' + uniqueKey,
            taskSwitchMode = 'application-switch-mode.' + uniqueKey,
            taskWebpackDevelopment = 'webpack-development.' + uniqueKey,
            taskRollup = 'rollup.' + uniqueKey,
            taskVendors = 'vendors.' + uniqueKey,
            taskStyles = 'styles.' + uniqueKey,
		    taskBuildIndex = 'build-index.' + uniqueKey;

		gulp.task(taskInitDevelopmentEnvironment, function(cb){
            process.env.ENV_NODE = common.ENV_DEVELOPMENT;
            common.initBuildEnvironment();
            cb();
        });

        gulp.task(taskInitProductionEnvironment, function(cb){
            process.env.ENV_NODE = common.ENV_PRODUCTION;
			common.initBuildEnvironment();
            cb();
        });

        gulp.task(taskClearTemplates, function () {
            console.log('');
            ensureTargetFilesDirectory();
            return gulp.src(config.source.less, {objectMode: true})
                .pipe(less())
                .pipe(concatCss(config.target.stylesFileName, {rebaseUrls: false}))
                .pipe(through.obj(
                    function (chunk, enc, cb) {

                        var currentStream = this;
                        if (chunk.isNull()) {
                            currentStream.push(chunk);
                            return cb();
                        }

                        if (chunk.isBuffer()) {
                            var source = swapImagePath(chunk.path, chunk.contents.toString());
                            chunk.contents = new Buffer(source);
                            currentStream.push(chunk);
                            return cb();
                        }
                        cb(null, chunk) ;
                    })
                )
                .pipe(cleanCss({debug: false}, function (details) {
                    // console.log(details.name + ': ' + details.stats.originalSize + ' => ' + details.stats.minifiedSize + '(' + details.stats.efficiency + '%)');
                }))
                .pipe(gulp.dest(config.target.root));
            console.log('');
        });

        gulp.task(taskBuildIndex, function () {
            gulp.src([config.source.root + '/index.html'])
                .pipe(htmlbuild({

                    // build js with preprocessor
                    js: htmlbuild.preprocess.js(function (block) {
                        block.write('./vendors.js?v=' + getFileHash(config.target.root + '/vendors.js'));
                        block.write('./application.js?v=' + getFileHash(config.target.root + '/application.js'));
                        block.end();

                    }),
                    // build css with preprocessor
                    css: htmlbuild.preprocess.css(function (block) {
                        block.write('./application.css?v=' + getFileHash(config.target.root + '/application.css'));
                        block.end();

                    })
                }))
                .pipe(gulp.dest(config.target.root));
        });

        gulp.task(taskCleanAppJs, function (cb) {
            var targets = [config.target.root + '/' + config.target.applicationFileName];
            targets.push(config.target.root + '/' + config.target.applicationMapFileName);
            return del(targets, {force: true}, cb);
        });

        gulp.task(taskCleanAppCss, function (cb) {

            return del([config.target.root + '/' + config.target.stylesFileName], {force: true}, cb);
        });

        gulp.task(taskClearTemp, function (cb) {
            return del(config.temp.cleanPath, {force: true}, cb);
        });

        gulp.task(taskCleanAppFiles, function (cb) {
            return del(config.target.files, {force: true}, cb);
        });

        gulp.task(taskCleanVendors, function (cb) {
            var targets = [config.target.root + '/' + config.target.vendorsFileName];
            targets.push(config.target.root + '/' + config.target.vendorsMapFileName);
            return del(targets, {force: true}, cb);
        });

        gulp.task(taskSwitchMode, function (cb) {
            if (process.env.ENV_NODE === common.ENV_DEVELOPMENT) {
                return gulp.src(config.temp.application + '/' + config.common.mainFileName)
                    .pipe(gulpReplace('// conditional_compilation_anchor', ''))
                    .pipe(gulp.dest(config.temp.application));
            }
            return cb();
        });

        gulp.task(taskApplicationMergeTemplates, function () {
            console.log('');
            return mergeTemplates();
        });

        gulp.task(taskApplicationClearTemplates, function () {
            mergeTemplates(true);
            console.log('');
            return gulp.src(config.temp.application + '/**/*.js')
                .pipe(clearCompiledTemplates())
                .pipe(gulp.dest(config.temp.application));
        });

        gulp.task(taskMoveTsConfig, function () {
			console.log();
			return gulp.src(config.common.rootFolderName + '/tsconfig-aot.json')
				.pipe(applyBuildModuleTemplate(common.targetModulePostfix))
				.pipe(gulp.dest(config.temp.root));
		});

		gulp.task(taskUpdateMainWithBuild, function () {
			console.log();
			return gulp.src(config.temp.application + '/' + config.common.mainFileName)
				.pipe(applyBuildModuleTemplate(common.targetModuleFactoryPostfix))
				.pipe(gulp.dest(config.temp.application));
		});

        gulp.task(taskNgc, function (cb) {
            var cmd = os.platform() === 'win32' ?
                'node_modules\\.bin\\ngc -p ' + config.temp.root + '\\tsconfig-aot.json --locale=en-US' :
                'node_modules/.bin/ngc -p ' + config.temp.root + '/tsconfig-aot.json --locale=en-US';

            childProc(cmd, function (err, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);
                cb(err);
            });
        });

        gulp.task(taskWebpackDevelopment, function (cb) {
            var cmd = os.platform() === 'win32' ?
                'node_modules\\.bin\\webpack --config__ ' + config.common.rootFolderName + '\\webpack.aot.config.js' :
                './node_modules/.bin/webpack --config__ ' + config.common.rootFolderName + '/webpack.aot.config.js';

            childProc(cmd, function (err, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);
                cb(err);
            });
        });

        gulp.task(taskRollup, function (cb) {
            var cmd = os.platform() === 'win32' ?
                'node_modules\\.bin\\rollup -c ' + config.common.rootFolderName + '\\rollup.config.js' :
                './rollup-config__/.bin/rollup -c ' + config.common.rootFolderName + '/rollup.config.js';

            childProc(cmd, function (err, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);
                cb(err);
            });
        });

        gulp.task(taskStyles, function () {
            console.log('');
            ensureTargetFilesDirectory();
            return gulp.src(config.source.less, {objectMode: true})
                .pipe(less())
                .pipe(through.obj(
                    function (chunk, enc, cb) {

                        var currentStream = this;
                        if (chunk.isNull()) {
                            currentStream.push(chunk);
                            return cb();
                        }

                        if (chunk.isBuffer()) {
                            var source = swapImagePath(chunk.path, chunk.contents.toString());
                            chunk.contents = new Buffer(source);
                            currentStream.push(chunk);
                            return cb();
                        }
                        cb(null, chunk) ;
                    })
                )
                .pipe(concatCss(config.target.stylesFileName, {rebaseUrls: false}))
                .pipe(cleanCss({debug: false}, function (details) {
                    // console.log(details.name + ': ' + details.stats.originalSize + ' => ' + details.stats.minifiedSize + '(' + details.stats.efficiency + '%)');
                }))
                .pipe(gulp.dest(config.target.root));
            console.log('');
        });

        gulp.task(taskTsLint, function () {
            return gulp.src(config.source.application + '/**/*.ts')
                .pipe(tsLint({
                    configuration: tsLintConfig,
                    formatter: "verbose"
                }))
                .pipe(tsLint.report());
        });

        gulp.task(taskVendors, function () {
            var files = (process.env.ENV_NODE === common.ENV_DEVELOPMENT) ?
                config.source.vendors.development.js :
                config.source.vendors.production.js;

            files = files.concat(config.source.vendors.common);

            var result =
                gulp.src(files)
                    .pipe(gulpConcat(config.target.vendorsFileName));
            if (process.env.ENV_NODE === common.ENV_PRODUCTION) {
                result = result.pipe(uglifyJs({mangle: true, debug: false}));
            }
            else {
                result =
                    result.pipe(sourcemaps.init())
                        .pipe(sourcemaps.write('', {
                            mapFile: function(mapFilePath) {
                                // source map files are named *.map instead of *.js.map
                                return mapFilePath;
                            }}));
            }
            result = result.pipe(gulp.dest(config.target.root));

            return result;
        });

        gulp.task('client-development', [], function (callback) {
            runSequence(
                taskInitDevelopmentEnvironment,
                taskCleanAppJs,
                taskCleanAppCss,
                taskCleanAppFiles,
                taskCleanVendors,
                taskTsLint,
                taskStyles,
                taskClearTemp,
                taskApplicationMergeTemplates,
                taskMoveTsConfig,
				taskUpdateMainWithBuild,
                taskSwitchMode,
                taskNgc,
                taskApplicationClearTemplates,
                taskRollup,
                taskVendors,
                taskClearTemp,
                taskBuildIndex,
                callback
            );
        });

        gulp.task('client-production', [], function (callback) {
            runSequence(
                taskInitProductionEnvironment,
                taskCleanAppJs,
                taskCleanAppCss,
                taskCleanAppFiles,
                taskCleanVendors,
                taskTsLint,
                taskStyles,
                taskClearTemp,
                taskApplicationMergeTemplates,
                taskMoveTsConfig,
				taskUpdateMainWithBuild,
                taskSwitchMode,
                taskNgc,
                taskApplicationClearTemplates,
                taskRollup,
                taskVendors,
                taskClearTemp,
                taskBuildIndex,
                callback
            );
        });

        gulp.task('client-check', function (callback) {
            runSequence(
                taskInitDevelopmentEnvironment,
                taskTsLint,
                taskClearTemp,
                taskApplicationMergeTemplates,
                taskMoveTsConfig,
				taskUpdateMainWithBuild,
                taskNgc,
                taskApplicationClearTemplates,
                taskRollup,
                taskClearTemp,
                callback
            );
        });

        gulp.task('client-app', [], function (callback) {
            runSequence(
                taskCleanAppJs,
                taskCleanAppCss,
                taskTsLint,
                taskStyles,
                taskClearTemp,
                taskApplicationMergeTemplates,
                taskMoveTsConfig,
				taskUpdateMainWithBuild,
                taskSwitchMode,
                taskNgc,
                taskApplicationClearTemplates,
                taskRollup,
                taskClearTemp,
                callback
            );
        });

        gulp.task('client-app-js', function (callback) {
            runSequence(
                taskCleanAppJs,
                taskTsLint,
                taskClearTemp,
                taskApplicationMergeTemplates,
                taskMoveTsConfig,
				taskUpdateMainWithBuild,
                taskSwitchMode,
                taskNgc,
                taskApplicationClearTemplates,
                taskRollup,
                taskClearTemp,
                callback
            );
        });

        gulp.task('app-less', [], function (callback) {
            runSequence(
                taskStyles,
                callback
            );
        });

        gulp.task('default', ['development']);
    };


    module.exports =  initGulp;

}());