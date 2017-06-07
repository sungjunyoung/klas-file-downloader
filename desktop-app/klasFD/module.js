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