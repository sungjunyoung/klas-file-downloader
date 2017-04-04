/**
 * Created by junyoung on 2017. 4. 2..
 */

var request = require('request');
var cheerio = require('cheerio');
var Promise = require('promise');
const readline = require('readline');
var https = require('https');
var querystring = require('querystring');
var fs = require('fs');


var j = request.jar();
request = request.defaults({jar: j});

exports.login = function (id, pw) {
    return new Promise(function (resolve, reject) {
        request({
            url: "https://klas.khu.ac.kr/user/loginUser.do",
            method: "POST",
            form: {USER_ID: id, PASSWORD: pw},
            timeout: 3000
        }, function (err, res, body) {
            if (err) {
                reject('timeout');
            } else if (j.getCookies("https://klas.khu.ac.kr").length === 0) {
                reject('login_error');
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
            // lectureLinkList[i].link =  $(this).attr('href')
            lectureLinkList[i].link = 'https://klas.khu.ac.kr' + $(this).attr('href')
        });

        resolve(lectureLinkList);

    })
};

exports.selectLecture = function (lectureLinkList) {

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    var selectQuestion = '';
    selectQuestion += '\n  강의자료를 다운받을 강의를 선택해 주세요  \n';
    var count = 0;

    return new Promise(function (resolve, reject) {

        for (var i in lectureLinkList) {
            count += 1;
            selectQuestion += '    ' + count + '. ' + lectureLinkList[i].lectureName + '\n';
        }
        selectQuestion += '\n';
        selectQuestion += '  입력 (1 ~ ' + count + ') : ';


        rl.question(selectQuestion, (answer) => {

            answer = parseInt(answer) - 1;
            resolve(lectureLinkList[answer]);

            rl.close();
        });
    });

};

exports.getClassPageBody = function (lectureLink) {

    return new Promise(function (resolve, reject) {

        var url = lectureLink.link;

        var headers = {
            'Cookie': 'COURSE_MENU_NAME=%uAC15%uC758%uC2E4',
            'User-Agent': 'request'
        };

        request({
            url: url,
            mothod: 'GET',
            jar: j,
            headers: headers
        }, function (err, res, body) {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        })
    })
};

exports.findFiles = function (classPageBody) {

    return new Promise(function (resolve, reject) {
        var $ = cheerio.load(classPageBody);
        var fileDownAnchors = $('.mycl_listbox.today');

        var fileArr = [];


        fileDownAnchors.each(function (i) {
            var tempFileArr = [];
            $(this).find('.mycl_veiw_learnig').find('.file-downbox-list').find('a').each(function (j) {
                var link = 'https://klas.khu.ac.kr' + $(this).attr('href').split('..')[1];
                tempFileArr.push(link);
            });
            fileArr.push(tempFileArr);
        });

        resolve(fileArr);
    })
};

exports.getSelectedFiles = function (fileArr, lb) {

    return new Promise(function (resolve, reject) {

        var lectureBefore = 0;
        if(!lb || lb === ''){
            lectureBefore = 0;
        } else {
            lectureBefore = lb;
        }

        var downloadIndex = fileArr.length - lectureBefore - 1;

        if (downloadIndex < 0) {
            reject('no reference files');
        }

        resolve(fileArr[downloadIndex]);
    })
};

exports.downloadSelectedFile = function (selectedFile, path) {

    return new Promise(function (resolve, reject) {

        var downloadPath;
        if(!path || path === ''){
            downloadPath = '';
            //TODO Default Path 설정하기
        } else {
            downloadPath = path;
            //TODO 사용자가 지정한 path 리포맷하기
        }

        var count = 0;
        selectedFile.forEach(function (value, index) {

            request = https.get(value, function (response) {
                count ++;
                var file = fs.createWriteStream("./file_" + index + ".pdf");
                response.pipe(file);

                if (index === count) {
                    resolve('done');
                }

            });

        })
    })
};