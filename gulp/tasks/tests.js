const gulp = require('gulp');
const mocha = require('gulp-mocha');
const path = require('path');
const gloader = require('gloader');

const conf = gloader('nconf', 'file', ['conf'], 'json', path.join(__dirname, '../'));

const task = () => {
    conf.use('conf');
    return gulp.src([`${conf.get('path:testsDir')}/index.js`], { read: false })
        .pipe(mocha({
            reporter: 'spec',
            timeout : conf.get('testTimeout'),
            globals: {
                should: require('should')
            }
        }));
};
module.exports = task;