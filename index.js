#!/usr/bin/env node

var args = require('args');
var functions = require('./functions');
var os = require('os');

args
    .option('id', 'Your Student ID of KHU, Required')
    .option('pw', 'Your Password of KHU, It is never exploited, Required')
    .option('lectureBefore', '0 is default, 1 2 .. wil download past lecture reference files')
    .option('downloadPath', 'default ~/Downlaod/Klas, will determine download location')

const flags = args.parse(process.argv);

if (!flags.id) {
    console.log('id is required!');
    return;
} else if (!flags.pw) {
    console.log('pw is required!');
    return;
}


functions.login(flags.id, flags.pw)
    .then(functions.getLecture)
    .then(functions.getLectureLink)
    .then(functions.selectLecture)
    .then(functions.getClassPageBody)
    .then(functions.findFiles)
    .then(function (fileArr) {
        var lectureBefore;
        if (!flags.lectureBefore) {
            lectureBefore = 0;
        } else {
            lectureBefore = flags.lectureBefore;
        }
        return functions.getSelectedFiles(fileArr, lectureBefore);
    })
    .then(function (selectedFile) {

        var path;
        if (!flags.downloadPath) {
            path = os.homedir() + '/downloads/klasFileDownloader'
        } else {
            path = flags.downloadPath;
        }
        //
        // if (path[path.length - 1] === '/') {
        //     path = path.substr(0, path.length - 1);
        // }


        functions.downloadSelectedFile(selectedFile, path)
    })
    .catch(function (err) {
        console.log(err);
    });


