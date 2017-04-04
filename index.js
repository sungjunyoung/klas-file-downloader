#!/usr/bin/env node

var args = require('args');
var functions = require('./functions');
var os = require('os');

args
    .option('id', '[필수] 학번을 입력합니다.')
    .option('pw', '[필수] 비밀번호를 입력합니다. 절대 악용되지 않습니다.')
    .option('lectureBefore', '[선택] 몇번째 전 강좌의 자료를 다운받을지 선택합니다. Default 는 0 입니다.')
    .option('downloadPath', '[선택] 자료를 다운받을 경로를 선택합니다.');

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
        return functions.getSelectedFiles(fileArr, flags.lectureBefore);
    })
    .then(function (selectedFile) {
        functions.downloadSelectedFile(selectedFile, flags.downloadPath);
    })
    .catch(function (err) {
        console.log(err);
    });


