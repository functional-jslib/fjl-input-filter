import * as path from 'path';
import * as fs from 'fs';

import * as packageJson from './package';

import gulp from 'gulp';
import concat from 'gulp-concat';
import * as eslint from 'gulp-eslint';
import header from 'gulp-header';
import uglify from 'gulp-uglify';
import jsdoc from 'gulp-jsdoc3';
import gulpBabel from 'gulp-babel';

/** Rollup plugins **/
import * as rollup from 'rollup';
import rollupBabel from 'rollup-plugin-babel';
import rollupResolve from 'rollup-plugin-node-resolve';

/** Util Modules **/
import del from 'del';
import moduleMemberListsReadStream from './node-scripts/moduleMemberListsReadStream';

/** Module's inner modules map (for members list stream) **/
import * as Input from './src/Input';
import * as InputFilter from './src/InputFilter';
// import * as Utils from './src/Utils';

const

    /** System and config includes **/
    {buildConfig, buildConfig: {srcsGlob}} = packageJson,

    /** Gulp Modules (or modules used by gulp) **/

    getReadStreamFinish = (resolve, reject) => err => err ? reject(err) : resolve(),

    /** Paths **/
    {docs: docsBuildPath, dist: buildPathRoot} = buildConfig.paths,

    buildPath = (...tails) => path.join(buildPathRoot, ...tails),

    log = console.log.bind(console),

    // Build paths
    cjsBuildPath = buildPath(buildConfig.folderNames.cjs),
    amdBuildPath  = buildPath(buildConfig.folderNames.amd),
    umdBuildPath  = buildPath(buildConfig.folderNames.umd),
    iifeBuildPath  = buildPath(buildConfig.folderNames.iife),
    es6BuildPath  = buildPath(buildConfig.folderNames.es6Module),

    // Module names
    {outputFileNameMin, outputFileName, outputFileNameMjs, inputModuleName} = buildConfig,

    {series, dest, src, parallel} = gulp,

    innerModulesMap = {
        Input,
        InputFilter,
        // Utils
    },

    deleteFilePaths = pathsToDelete =>
        del(pathsToDelete)
            .then(deletedPaths => {
                if (deletedPaths.length) {
                    log('\nThe following paths have been deleted: \n - ' + deletedPaths.join('\n -'));
                    return;
                }
                log(' - No paths to clean.\n', '--mandatory');
            })
            .catch(log),

    cleanTask = () => {
        let pathsToDelete = [cjsBuildPath, amdBuildPath, umdBuildPath, iifeBuildPath, es6BuildPath]
            .map(partialPath => path.join(partialPath, '**', '*.js'));
        return deleteFilePaths(pathsToDelete);
    },

    eslintTask = () =>
        src([srcsGlob, '!node_modules/**'])
            .pipe(eslint())
            .pipe(eslint.format())
            .pipe(eslint.failOnError()),

    umdTask = () =>
        src(srcsGlob)
        .pipe(gulpBabel(buildConfig.buildUmdOptions.babel))
        .pipe(dest(umdBuildPath)),

    amdTask = () =>
        src(srcsGlob)
            .pipe(gulpBabel(buildConfig.buildAmdOptions.babel))
            .pipe(dest(amdBuildPath)),

    cjsTask = () =>
        src(srcsGlob)
            .pipe(gulpBabel(buildConfig.buildCjsOptions.babel))
            .pipe(dest(cjsBuildPath)),

    iifeTask = () =>
        rollup.rollup({
            input: `src/${inputModuleName}.js`,
            external: buildConfig.buildIifeOptions.rollup.external,
            plugins: [
                rollupResolve(),
                rollupBabel({
                    babelrc: false,
                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                modules: false
                            }
                        ]
                    ],
                    exclude: ['node_modules/**'] // only transpile our source code
                })
            ]
        })
        .then(bundle => bundle.write({
            file: path.join(iifeBuildPath, outputFileName),
            format: 'iife',
            name: inputModuleName,
            sourcemap: true
        })),

    es6ModuleTask = () =>
        rollup.rollup({
            input: `src/${inputModuleName}.js`,
            external: buildConfig.es6ModuleRollup.config.external,
            plugins: [
                rollupResolve(),
                rollupBabel({
                    babelrc: false,
                    presets: [],
                    exclude: ['node_modules/**'],
                })
            ]
        })
            .then(bundle => bundle.write({
                file: path.join(es6BuildPath, outputFileNameMjs),
                format: 'es',
                name: inputModuleName,
                sourcemap: true
            })
                .then(() => bundle)
            )
            .then(bundle => bundle.write({
                file: path.join(es6BuildPath, outputFileName),
                format: 'es',
                name: inputModuleName,
                sourcemap: true
            })),

    uglifyTask = () => {
        const data = {};
        return src(path.join(iifeBuildPath, outputFileName))
            .pipe(concat(path.join(iifeBuildPath, outputFileNameMin)))
            .pipe(gulpBabel(buildConfig.buildIifeOptions.babel))
            .pipe(uglify(buildConfig.uglifyOptions))
            .pipe(header('/**! ' + outputFileName + ' <%= version %> | License: <%= license %> | ' +
                'Built-on: <%= (new Date()) %> **/', Object.assign(data, packageJson)))
            .pipe(dest('./'));
    },

    buildJsTask = parallel(series(iifeTask, uglifyTask), cjsTask, amdTask, umdTask, es6ModuleTask),

    buildTask = series(cleanTask, buildJsTask),

    readmeTask = () => {
        const moduleMemberListOutputPath = './markdown-fragments-generated/module-and-member-list.md';

        return deleteFilePaths([
            './markdown-fragments-generated/*.md',
            './README.md'
        ])
            .then(() => new Promise((resolve, reject) => moduleMemberListsReadStream(innerModulesMap)
                .pipe(fs.createWriteStream(moduleMemberListOutputPath))
                .on('finish', getReadStreamFinish(resolve, reject))
            ))
            .then(() => new Promise((resolve, reject) => gulp.src(buildConfig.readme.files)
                .pipe(concat('./README.md'))
                .pipe(gulp.dest('./'))
                .on('finish', getReadStreamFinish(resolve, reject))
            ));
    },

    docTask = series(readmeTask, function docTask () {
        return deleteFilePaths([`${docsBuildPath}/**/*`])
            .then(() => new Promise((resolve, reject) =>
                src(['README.md', srcsGlob])
                    .on('finish', getReadStreamFinish(resolve, reject))
                    .pipe(jsdoc(buildConfig.jsdoc))
            ));
    }),

    watchTask = series(buildTask, function watchTask () {
            return gulp.watch([srcsGlob, './node_modules/**'], buildJsTask);
        }
    );

    gulp.task('eslint', eslintTask);

    gulp.task('build', buildTask);

    gulp.task('readme', readmeTask);

    gulp.task('docs', docTask);

    gulp.task('watch', watchTask);

    gulp.task('default', watchTask);
