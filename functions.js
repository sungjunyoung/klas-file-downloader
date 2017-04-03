/**
 * Created by junyoung on 2017. 4. 2..
 */

var request = require('request');
var cheerio = require('cheerio');

var Promise = require('promise');

exports.login = function (id, pw) {

    var j = request.jar();
    request = request.defaults({jar: j});

    return new Promise(function (resolve, reject) {
        request({
            url: "https://klas.khu.ac.kr/user/loginUser.do",
            method: "POST",
            form: {USER_ID: id, PASSWORD: pw}
        }, function (err, res, body) {
            if (err) {
                reject('ERROR');
            } else {
                resolve(body);
            }
        })
    });
};

exports.getLecture = function () {
    return new Promise(function (resolve, reject) {
        request({
            url: "https://klas.khu.ac.kr/classroom/viewClassroomCourseMoreList.do?courseType=ing",
            method: "GET"
        }, function (err, res, body) {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        })
    })
};

exports.getLectureLink = function (getLectureBody) {

    return new Promise(function (resolve, reject) {
        var $ = cheerio.load(getLectureBody);
        var lectureLinks = $('.gomy_class');
        var tableTrs = $('#tbl > tbody > tr > td');

        var lectureLinkList = [];

        tableTrs.each(function (i) {
            if (i % 7 === 1) {
                lectureLinkList.push({lectureName: $(this).text()});
            }
        });


        lectureLinks.each(function (i) {
            lectureLinkList[i].link ='https://klas.khu.ac.kr' + $(this).attr('href')
        });

        resolve(lectureLinkList);

    })
};