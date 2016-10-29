const gloader = require('gloader');
const path = require('path');
const gulp = gloader('gulp', 'task', ['tests'], 'js', path.join(__dirname, './tasks'), require);