/**
 * Created by elyde on 12/13/2016.
 */

'use strict';

const path = require('path'),
    crypto = require('crypto'),
    packageJson = require('./package'),
    rollupConfig = packageJson.rollupConfig,
    gulpConfig = packageJson.buildConfig,

    /** Gulp Modules (or modules used by gulp) **/
    gulp =          require('gulp'),
    eslint =        require('gulp-eslint'),
    concat =        require('gulp-concat'),
    header =        require('gulp-header'),
    uglify =        require('gulp-uglify'),
    fncallback =    require('gulp-fncallback'),
    jsdoc =         require('gulp-jsdoc3'),
    lazyPipe =      require('lazypipe'),
    gulpUglifyEs =  require('gulp-uglify-es').default,
    gulpBabel =     require('gulp-babel'),

    // Rollup plugins
    rollup = require('rollup'),
    rollupBabel = require('rollup-plugin-babel'),
    rollupResolve = require('rollup-plugin-node-resolve'),

    /** Util Modules **/
    chalk = require('chalk'),
    del = require('del'),

    {dist, docs} = gulpConfig.paths,
    {amd, iife, cjs, es6Module, umd} = gulpConfig.folderNames,
    {inputModuleName, inputFilePath,
        outputFileNameMin, outputFileName, srcsGlob} = gulpConfig,

    buildPath = (...tails) => path.join.apply(path, [dist].concat(tails)),
    yargs = require('yargs'),

    argv = yargs()
        .default('dev', false)
        .default('skipLint', false)
        .alias('skip-lint', 'skipLint')
        .argv,

    {skipLint} = argv,

    eslintPipe = lazyPipe()
        .pipe(eslint)
        .pipe(eslint.format)
        .pipe(eslint.failOnError),

    log = console.log.bind(console),

    deleteFilePaths = pathsToDelete => {
        return del(pathsToDelete)
            .then(deletedPaths => {
                if (deletedPaths.length) {
                    log(chalk.dim('\nThe following paths have been deleted: \n - ' + deletedPaths.join('\n - ') + '\n'));
                    return;
                }
                log(chalk.dim(' - No paths to clean.') + '\n', '--mandatory');
            })
            .catch(log);
    };

gulp.task('clean', () => {
    let pathsToDelete = [amd, cjs, es6Module, iife, umd]
        .map(partialPath => buildPath(partialPath, '**', '*.js'));
    return deleteFilePaths(pathsToDelete);
});

gulp.task('eslint', () => gulp.src([
    srcsGlob,
    './tests/**/*-test.js',
    '!node_modules/**'
]).pipe(eslintPipe()));

gulp.task('umd', ['eslint'], () =>
    gulp.src(srcsGlob)
        .pipe(gulpBabel(gulpConfig.umdRollup.babel))
        .pipe(gulp.dest(buildPath(umd))));

gulp.task('amd', ['eslint'], () =>
    gulp.src(srcsGlob)
        .pipe(gulpBabel(gulpConfig.amdRollup.babel))
        .pipe(gulp.dest(buildPath(amd))));

gulp.task('cjs', ['eslint'], () =>
    gulp.src(srcsGlob)
        .pipe(gulpBabel(gulpConfig.cjsRollup.babel))
        .pipe(gulp.dest(buildPath(cjs))));

gulp.task('iife', ['eslint'], () =>
    rollup.rollup({
        input: inputFilePath,
        plugins: [
            rollupResolve(),
            rollupBabel({
                babelrc: false,
                presets: [['env', {
                    modules: false
                }]],
                plugins: [
                    'external-helpers'
                ],
                exclude: 'node_modules/**' // only transpile our source code
            })
        ],
        external: rollupConfig.external
    })
        .then(bundle => bundle.write({
            file: buildPath(iife, outputFileName),
            format: 'iife',
            name: inputModuleName,
            sourcemap: true
        })));

gulp.task('es6-module', ['eslint'], () => {
    const data = {
        version: packageJson.version,
        license: packageJson.license,
        fileHash: ''
    };
    return rollup.rollup({
        input: inputFilePath,
        plugins: [
            rollupResolve()
        ],
        external: rollupConfig.external
    })
        .then(bundle => bundle.write({
            file: buildPath(es6Module, outputFileName),
            format: 'es',
            name: inputModuleName,
            sourcemap: true
        }), log)
        .then(() => gulp.src(buildPath(es6Module, outputFileName))
            .pipe(concat(buildPath(es6Module, outputFileNameMin)))
            .pipe(gulpUglifyEs())
            .pipe(fncallback((file, enc, cb) => {
                let hasher = crypto.createHash('md5');
                hasher.update(file.contents.toString(enc));
                data.fileHash = hasher.digest('hex');
                return cb();
            }))
            .pipe(header('/**! ' + outputFileNameMin + ' <%= version %> | License: <%= license %> | ' +
                'md5checksum: <%= fileHash %> | Built-on: <%= (new Date()) %> **/', data))
            .pipe(gulp.dest('./'))
        )
});

gulp.task('uglify', ['iife'], () => {
    const data = {
        version: packageJson.version,
        license: packageJson.license,
        fileHash: ''
    };
    return gulp.src(buildPath(iife, outputFileName))
        .pipe(concat(buildPath(iife, outputFileNameMin)))
        .pipe(uglify({}))
        .pipe(fncallback((file, enc, cb) => {
            let hasher = crypto.createHash('md5');
            hasher.update(file.contents.toString(enc));
            data.fileHash = hasher.digest('hex');
            return cb();
        }))
        .pipe(header('/**! ' + outputFileNameMin + ' <%= version %> | License: <%= license %> | ' +
            'md5checksum: <%= fileHash %> | Built-on: <%= (new Date()) %> **/', data))
        .pipe(gulp.dest('./'));
});

gulp.task('build-js', ['iife', 'uglify', 'cjs', 'amd', 'umd', 'es6-module']);

gulp.task('jsdoc', () =>
    deleteFilePaths(['./docs/**/*'])
        .then(_ =>
            gulp.src(['README.md', srcsGlob], {read: false})
                .pipe(jsdoc({
                    opts: {
                        'template': 'templates/default',  // same as -t templates/default
                        'encoding': 'utf8',               // same as -e utf8
                        'destination': docs,       // same as -d ./out/
                        'recurse': true
                    }
                }))
        )
);

gulp.task('build-docs', ['jsdoc']);

gulp.task('build', ['build-js']);

gulp.task('watch', ['build'], () =>
    gulp.watch([
        srcsGlob,
        './node_modules/**'
    ], [
        'build-js'
    ]));

gulp.task('default', ['build', 'watch']);