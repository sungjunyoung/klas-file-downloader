/**
 * Created by junyoung on 2017. 4. 2..
 */

let request = require('request');
let cheerio = require('cheerio');
let Promise = require('promise');
let readline = require('readline');
let https = require('https');
let querystring = require('querystring');
let fs = require('fs');
let read = require('read');
const os = require('os');

let j = request.jar();
request = request.defaults({jar: j});

//TODO JSDoc 다시 정리하기
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
                if (err.code === 'ESOCKETTIMEDOUT') {
                    reject('  클라스 요청 응답시간이 너무 길어요... ㅠㅠ');
                } else {
                    reject('  알수없는 에러가 발생했어요!.');
                }
            } else if (j.getCookies("https://klas.khu.ac.kr").length === 0) {
                reject('  로그인에 실패했습니다!');
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
                reject('  파싱 중 에러가 발생했어요!');
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
        let $ = cheerio.load(getLectureBody);
        let lectureLinks = $('.gomy_class');
        let tableTrs = $('#tbl > tbody > tr > td');

        let lectureLinkList = [];

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

/**
 * @author sungjunyoung
 * @description lectureLinkList [{lectureName (string), link (string)}] 를 받고 강의를 선택합니다.
 *              그에대한 강의실 link (string) 를 리턴합니다.
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
    let selectQuestion = '';
    selectQuestion += '\n  강의자료를 다운받을 강의를 선택해 주세요 :D\n\n';
    let count = 0;

    return new Promise(function (resolve, reject) {

        for (let i in lectureLinkList) {
            count += 1;
            selectQuestion += '    ' + count + '. ' + lectureLinkList[i].lectureName + '\n';
        }
        selectQuestion += '\n';
        selectQuestion += '  입력 (1 ~ ' + count + ') : ';


        rl.question(selectQuestion, (answer) => {
            if (new RegExp('[1-' + count + ']').test(answer) === false) {
                console.log('\n  올바른 값을 입력해주세요!!');
                process.exit();
            }
            answer = parseInt(answer) - 1;
            resolve(lectureLinkList[answer]);

            rl.close();
        });
    });

};

/**
 * @author sungjunyoung
 * @description 강의실 링크의 url 을 받아서 HTML 를 리턴해주는 함수
 * @param {String} lectureLink - 강의실 URL
 * @returns {*|Promise}
 */
exports.getClassPageBody = function (lectureLink) {

    return new Promise(function (resolve, reject) {

        let url = lectureLink.link;

        let headers = {
            'Cookie': 'COURSE_MENU_NAME=%uAC15%uC758%uC2E4',
            'User-Agent': 'request'
        };

        request({
            url: url,
            mothod: 'GET',
            jar: j,
            headers: headers,
            timeout: 3000
        }, function (err, res, body) {
            if (err) {
                if (err.code === 'ESOCKETTIMEDOUT') {
                    reject('  클라스 요청 응답시간이 너무 길어요... ㅠㅠ');
                } else {
                    reject('  알수없는 에러가 발생했어요!.');
                }
            } else {
                resolve(body);
            }
        });
    });
};

/**
 * @author sungjunyoung
 * @description 강의실 URL 페이지 HTML 을 받아와서
 *              파일 다운로드 링크의 URL 어레이를 리턴 chapterFilesArr[{chapter, files[{link, fileName}]}]
 * @param {String} classPageBody - 강의실 URL 의 페이지 HTML
 * @returns {*|Promise}
 */
exports.findFiles = function (classPageBody) {

    return new Promise(function (resolve, reject) {
        let $ = cheerio.load(classPageBody);
        let fileDownAnchors = $('.mycl_listbox.today');

        let chapterFilesArr = [];

        fileDownAnchors.each(function (i) {
            let chapter = $(this).find('.lf').text();
            let tempChapterObj = {chapter: chapter, files: []};
            $(this).find('.mycl_veiw_learnig').find('.file-downbox-list').find('a').each(function (j) {
                let link = 'https://klas.khu.ac.kr' + $(this).attr('href').split('..')[1];
                let fileName = $(this).text();
                tempChapterObj.files.push({link: link, fileName: fileName});
            });
            chapterFilesArr.push(tempChapterObj);
        });

        resolve(chapterFilesArr);
    });
};

/**
 * @author sungjunyoung
 * @description findFiles 의 chapterFilesArr[{chapter, files[{link, fileName}]}] 을 받아
 *              사용자에게 선택하게 하고, 다운받아야 할 강의자료리스트 오브젝트 {chapter, files[{link, fileName}]} 를 리턴
 * @param {String} chapterFilesArr - 챕터별로 파일들과 파일 명의 리스트를 가지고 있는 리스트
 * @returns {*|Promise}
 */
exports.selectChapter = function (chapterFilesArr) {

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    let selectQuestion = '';
    selectQuestion += '\n 강의자료를 다운받을 챕터를 선택해 주세요 :)  \n\n';
    let counter = 0;
    for (let i in chapterFilesArr) {
        counter = i * 1 + 1;
        selectQuestion += '     ' + counter + '. ' + chapterFilesArr[i].chapter;
        selectQuestion += '\n';
    }
    selectQuestion += '\n';
    selectQuestion += '  입력 (1 ~ ' + counter + ') : ';

    return new Promise(function (resolve, reject) {
        rl.question(selectQuestion, (answer) => {
            if (new RegExp('[1-' + counter + ']').test(answer) === false) {
                console.log('\n  올바른 값을 입력해주세요!!');
                process.exit();
            }
            answer = parseInt(answer) - 1;
            resolve(chapterFilesArr[answer]);
            rl.close();
        });
    });
};

/**
 * @author sungjunyoung
 * @description
 * @param selectedFiles - 다운로드할 챕터 오브젝트
 * @param selectLecture - 선택된 강의명
 * @param downloadPath - 다운로드 경로
 * @returns {*|Promise}
 */
exports.downloadSelectedFiles = function (selectedFiles, selectLecture, downloadPath) {

    return new Promise(function (resolve, reject) {

        if (!downloadPath) {
            downloadPath = os.homedir() + '/Downloads/';
        } else {
            downloadPath = require('path').resolve(downloadPath) + '/';
        }


        // 다운로드 경로 설정
        if (!fs.existsSync(downloadPath + selectLecture + '/'))
            fs.mkdirSync(downloadPath + selectLecture + '/');
        downloadPath += selectLecture + '/';

        if (!fs.existsSync(downloadPath + selectedFiles.chapter + '/'))
            fs.mkdirSync(downloadPath + selectedFiles.chapter + '/');
        downloadPath += selectedFiles.chapter + '/';

        let count = 0;
        selectedFiles.files.forEach(function (value, index) {
            request = https.get(value.link, function (response) {
                count++;
                let file = fs.createWriteStream(downloadPath + value.fileName);
                response.pipe(file);

                if (selectedFiles.files.length === count) {
                    resolve('\n  파일이 ' + downloadPath + ' 에 저장되었어요! 열공 :)');
                }

            });

        });
    });
};

/**
 * @author sungjunyoung
 * @description 해당 강의에 대한 모든 강의자료를 다운로드합니다.
 * @returns {*|Promise}
 */
exports.downloadAllFiles = function (chapterFilesArr, selectLecture, downloadPath) {

    return new Promise(function (resolve, reject) {

        if (!downloadPath) {
            downloadPath = os.homedir() + '/Downloads/';
        } else {
            downloadPath = require('path').resolve(downloadPath) + '/';
        }

        if (!fs.existsSync(downloadPath + selectLecture + '/'))
            fs.mkdirSync(downloadPath + selectLecture + '/');
        downloadPath += selectLecture + '/';
        console.log('');

        let count = 0;
        chapterFilesArr.forEach(function (chapterObj, index) {
            var asyncDownloadPath = downloadPath + chapterObj.chapter + '/';

            if (!fs.existsSync(asyncDownloadPath))
                fs.mkdirSync(asyncDownloadPath);

            var subCount = 0;
            chapterObj.files.forEach(function (value, index) {
                request = https.get(value.link, function (response) {
                    let file = fs.createWriteStream(asyncDownloadPath + value.fileName);
                    response.pipe(file);

                    subCount++;
                    if (subCount === chapterObj.files.length) {
                        count++;
                        console.log('   다운로드중... (' + asyncDownloadPath + ')');
                        if (count === chapterFilesArr.length) {
                            resolve('\n  파일이 ' + downloadPath + ' 에 저장되었어요! 열공 :)');
                        }
                    }
                })
            });
        });

    })
};
