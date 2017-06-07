'use strict';

var gulp = require('gulp');
var electron = require('electron-connect').server.create();

gulp.task('default', function () {
// Start browser process
    electron.start();
// Restart browser process
    gulp.watch('app.js', electron.restart);
// Reload renderer process
    gulp.watch(['index.html', 'style.css'], electron.reload);
});