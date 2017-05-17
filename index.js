#!/usr/bin/env node

var args = require('args');
var functions = require('./functions');
// var os = require('os');


//TODO 예외처리

if(require.main === module){
    // 커멘드 라인 상에서 직접적으로 불려졌을 때

    args
        .option('id', '[필수] 학번을 입력합니다.')
        .option('pw', '[필수] 비밀번호를 입력합니다. 로컬 PC 에서만 사용하기 때문에 안전합니다 :).')
        .option('downloadPath', '[선택] 자료를 다운받을 경로를 입력합니다. (default 는 ~/Downloads 입니다.)')
        .option('all', '[선택] 다음 옵션을 주면 모든 강의의 자료를 다운받습니다.');

    const flags = args.parse(process.argv);

    if (!flags.id) {
        console.log('  학번(id) 가 필요해요!');
        return;
    } else if (!flags.pw) {
        console.log('  비밀번호(pw) 가 필요해요!');
        return;
    } else {
        functions.login(flags.id, flags.pw)
            .then(functions.getLecture)
            .then(functions.getLectureLink)
            .then(functions.selectLecture)
            .then(functions.getClassPageBody)
            .then(functions.findFiles)
            .then(function(chapterFilesArr){
                if(flags.all){
                    // TODO 전체강의 다운받는 함수 구현
                } else {
                    return functions.selectChapter(chapterFilesArr);
                }

            })
            .then(function(selectedFiles){
                return functions.downloadSelectedFiles(selectedFiles, flags.downloadPath);
            })
            .then(function(result){
                console.log(result);
            })
            .catch(function (err) {
                console.log(err);
            });
    }

} else {
    // 모듈로 불려졌을때 (준비중)

    // module.exports = {
    //
    //     getLectureList: function (id, pw, callback) {
    //         functions.login(id, pw)
    //             .then(functions.getLecture)
    //             .then(functions.getLectureLink)
    //             .then(function(lectureList){
    //                 callback(lectureList);
    //             })
    //     }
    //
    // };

}



