/**
 * Created by junyoung on 2017. 4. 2..
 */

var request = require('request');
var cheerio = require('cheerio');
var Promise = require('promise');
var readline = require('readline');
var https = require('https');
var querystring = require('querystring');
var fs = require('fs');


var j = request.jar();
request = request.defaults({jar: j});


/**
 * @author sungjunyoung
 * @description klas에 로그인해서 세션을 받습니다.
 *              3초가 넘게 응답이 없으면 klas 서버 오류,
 *              쿠키를 받지 못했을 경우 로그인 에러를 반환합니다.
 * @param id
 * @param pw
 * @returns {*|Promise}
 */
exports.login = function (id, pw) {
    return new Promise(function (resolve, reject) {
        request({
            url: "https://klas.khu.ac.kr/user/loginUser.do",
            method: "POST",
            form: {USER_ID: id, PASSWORD: pw},
            timeout: 3000
        }, function (err, res, body) {
            if (err) {
                reject('클라스 요청 응답시간이 너무 길어요.');
            } else if (j.getCookies("https://klas.khu.ac.kr").length === 0) {
                reject('로그인에 실패했습니다!');
            } else {
                resolve('success');
            }
        })
    });
};

/**
 * @author sungjunyoung
 * @description login 세션을 가지고 현재 수강중인 강의 리스트를 보여주는 페이지에 접근합니다.
 *              해당 페이지의 html 소스를 반환합니다.
 * @returns {*|Promise}
 */
exports.getLecture = function () {

    return new Promise(function (resolve, reject) {
        request({
            url: "https://klas.khu.ac.kr/classroom/viewClassroomCourseMoreList.do?courseType=ing",
            method: "GET"
        }, function (err, res, body) {
            if (err) {
                console.log(err);
                reject('파싱 중 에러가 발생했어요!');
            } else {
                resolve(body);
            }
        })
    })
};

/**
 * @author sungjunyoung
 * @description getLecture 에서 받은 페이지 소스에서 강의 이름과 강의실로 가는 링크를 파싱합니다.
 *              lectureLinkList 에 오브젝트 리스트 형태로 결과를 반환합니다.
 * @param getLectureBody
 * @returns {*|Promise}
 */
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

        console.log(lectureLinkList);
        resolve(lectureLinkList);

    })
};

/**
 * @author sungjunyoung
 * @description lectureLinkList [{lectureName (string), link (string)}] 를 받고 강의를 선택합니다. 그에대한 강의실 link (string) 를 리턴합니다.
 * @param {Object[]} lectureLinkList - 강좌명, 강의실을 포함하는 리스트들
 * @param lectureLinkList[].lectureName - 강의명 [강의코드]
 * @param lectureLinkList[].link - 강의실 link
 * @returns {*|Promise}
 */
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
        });
    });
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
    });
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
            reject('이 날에는 강의자료가 없네요!');
        }

        resolve(fileArr[downloadIndex]);
    });
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

        });
    });
};
