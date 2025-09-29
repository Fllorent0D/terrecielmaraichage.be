'use strict';

var gulp         = require('gulp'),
	watch        = require('gulp-watch'),
	uglify       = require('gulp-uglify'),
	sass         = require('gulp-sass')(require('sass')),
	postcss      = require('gulp-postcss'),
	cleanCSS     = require('gulp-clean-css'),
	autoprefixer = require('autoprefixer'),
	changed      = require('gulp-changed'),
	rename       = require('gulp-rename'),
	sourcemaps   = require('gulp-sourcemaps'),
	fileinclude  = require('gulp-file-include'),
	rimraf       = require('rimraf'),

	path = {
		dist: {
			html:   'dist/',
			js:     'dist/js/',
			jsLib:  'dist/js/lib/',
			style:  'dist/css/',
			img:    'dist/img/',
			fonts:  'dist/fonts/'
		},
		src: {
			html:  ['src/html/**/*.html','!src/html/template/*.html'],
			js:    ['src/js/lib/device.js', 'src/js/lib/jquery-2.2.4.js', 'src/js/main.js'],
			jsLib: 'src/js/lib/**/*.js',
			style:  'src/style/main.scss',
			img:    'src/img/**/*.*',
			fonts:  'src/fonts/**/*.*'
		},
		watch: {
			html:   'src/html/**/*.html',
			js:     'src/js/**/*.js',
			style:  'src/style/**/*.{css,scss}',
			img:    'src/img/**/*.*',
			fonts:  'src/fonts/**/*.*'
		},
		clean: './dist'
	};

var postCssPlugins = [
	autoprefixer({
		overrideBrowserslist: ['last 25 versions', '> 1%', 'ie 9']
	})
];

gulp.task('clean', function (cb) {
	rimraf(path.clean, cb);
});

gulp.task('html:build', function () {
	return gulp.src(path.src.html)
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file',
			indent: true
		}))
		.pipe(gulp.dest(path.dist.html));
});

gulp.task('js:build', function ()
{
	return gulp.src(path.src.js)
		.pipe(sourcemaps.init())
		.pipe(gulp.dest(path.dist.js))
		.pipe(uglify())
		.pipe(rename({suffix: ".min"}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(path.dist.js));
});

gulp.task('jslib:build', function ()
{
	return gulp.src(path.src.jsLib)
		.pipe(changed(path.dist.jsLib))
		.pipe(gulp.dest(path.dist.jsLib));
});

gulp.task('style:build', function ()
{
	return gulp.src(path.src.style)
		.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(cleanCSS({
			format: 'beautify',
			level: 2
		}))
		.pipe(postcss(postCssPlugins))
		.pipe(rename({basename: "style"}))
		.pipe(gulp.dest(path.dist.style))
		.pipe(cleanCSS())
		.pipe(rename({suffix: ".min"}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(path.dist.style));
});

gulp.task('image:build', function ()
{
	return gulp.src(path.src.img)
		.pipe(changed(path.dist.img))
		.pipe(gulp.dest(path.dist.img));
});

gulp.task('fonts:build', function()
{
	return gulp.src(path.src.fonts)
		.pipe(changed(path.dist.fonts))
		.pipe(gulp.dest(path.dist.fonts))
});


gulp.task('js:dev', function ()
{
	return gulp.src(path.src.js)
		.pipe(sourcemaps.init())
		.pipe(rename({suffix: ".min"}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(path.dist.js));
});

gulp.task('jslib:dev', function ()
{
	return gulp.src(path.src.jsLib)
		.pipe(changed(path.dist.jsLib))
		.pipe(gulp.dest(path.dist.jsLib));
});

gulp.task('style:dev', function ()
{
	return gulp.src(path.src.style)
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(postcss(postCssPlugins))
		.pipe(cleanCSS({
			format: 'beautify',
			level: 2
		}))
		.pipe(rename({
			basename: "style",
			suffix: ".min"
		}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(path.dist.style));
});

gulp.task('image:dev', function ()
{
	return gulp.src(path.src.img)
		.pipe(changed(path.dist.img))
		.pipe(gulp.dest(path.dist.img));
});

gulp.task('build', gulp.series(
	'html:build',
	'js:build',
	'jslib:build',
	'style:build',
	'fonts:build',
	'image:build'
));

gulp.task('dev', gulp.series(
	'clean',
	'html:build',
	'js:dev',
	'jslib:dev',
	'style:dev',
	'fonts:build',
	'image:dev'
));

gulp.task('default', gulp.series('clean', 'build'));

gulp.task('watch', function (_cb)
{
	watch(path.watch.html, function(event, cb)
	{
		gulp.series('html:build')(cb);
	});
	watch(path.watch.style, function(event, cb)
	{
		gulp.series('style:dev')(cb);
	});
	watch(path.watch.js, function(event, cb)
	{
		gulp.series('js:dev', 'jslib:dev')(cb);
	});
	watch(path.watch.img, function(event, cb)
	{
		gulp.series('image:dev')(cb);
	});
	watch(path.watch.fonts, function(event, cb)
	{
		gulp.series('fonts:build')(cb);
	});

	_cb();
});