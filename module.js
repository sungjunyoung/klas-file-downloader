var functions = require('./functions');

exports.getLectureList = function (id, pw, cb) {
    functions.login(id, pw)
        .then(functions.getLecture)
        .then(functions.getLectureLink)
        .then(function(res){
            cb(res);
        })
        .catch(function(err){
            cb(err);
        })
};

exports.getLectureFileLinks = function(lectureLink, cb){
    functions.getClassPageBody(lectureLink)
        .then(functions.findFiles)
        .then(function(res){
            cb(res);
        })
        .catch(function(err){
            cb(err);
        })
};

exports.isValidIdPw = function(id, pw, cb){
    functions.login(id, pw)
        .then(function(){
            cb(true);
        })
        .catch(function(){
            cb(false);
        })
};

exports.downloadSelectedFiles = function(selectedChapter, selectedLecture, cb){
    functions.downloadSelectedFiles(selectedChapter, selectedLecture,null)
        .then(function(res){
            cb(res);
        })
        .catch(function(err){
            cb(err);
        })
};

exports.downloadAllFiles = function(selectedFilesArr, selectedLecture, cb){
    functions.downloadAllFiles(selectedFilesArr, selectedLecture,null)
        .then(function(res){
            cb(res);
        })
        .catch(function(err){
            cb(err);
        })
};