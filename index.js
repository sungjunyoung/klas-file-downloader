#!/usr/bin/env node

var args = require('args');
var functions = require('./functions');

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
    .then(function(res){
        console.log(res);
    })
    .catch(function (err) {
        console.log(err);
    });

