/**
 * Created by junyoung on 2017. 6. 7..
 */


let klasFD = require('./klasFD/module');

let userLectures = [];
let lectureFiles = [];
let selectedLecture = '';
$(document).ready(function () {
    // 앱 시작하면 로그인 바로 체크
    disableAll('로그인 상태를 체크중입니다...');
    if (localStorage.getItem('id')) {
        checkLoginState(function (isValid) {
            ableAll();
            if (isValid) {
                swal({
                    title: "로그인 되었습니다!",
                    type: "success",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#424242",
                });
                // 로그인되면 강의정보 가져오고 레이아웃 업데이트
                const id = localStorage.getItem('id');
                const pw = localStorage.getItem('pw');
                klasFD.getLectureList(id, pw, function (res) {
                    if (res.code) {
                        swal({
                            title: "강의정보를 가져오는데 실패했습니다!",
                            text: res.message,
                            type: "error",
                            confirmButtonText: "OK",
                            confirmButtonColor: "#424242",
                        });
                    } else {
                        userLectures = res;
                        renderLectureList();
                        updateLayoutInLogin();
                    }
                });


            } else {
                // 로그인 실패
                swal({
                    title: "로그인에 실패했습니다!",
                    text: "다시 로그인해주세요!",
                    type: "error",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#424242",
                });
            }
        });
    } else {
        ableAll();
    }

    $('#loginBtn').click(function () {
        let id = $('#id').val();
        let pw = $('#pw').val();

        disableAll('로그인 중입니다...');
        klasFD.getLectureList(id, pw, function (res) {

            console.log(res);
            if (res.code) {
                ableAll();
                // 로그인 실패
                swal({
                    title: "로그인에 실패했습니다!",
                    text: res.message,
                    type: "error",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#424242",
                });
            } else {
                // 로그인 성공
                localStorage.setItem('id', id);
                localStorage.setItem('pw', pw);

                // 강의정보 가져오기
                disableAll('강의정보를 가져오고 있습니다...');
                klasFD.getLectureList(id, pw, function (res) {
                    ableAll();
                    if (res.code) {
                        swal({
                            title: "강의정보를 가져오는데 실패했습니다!",
                            text: res.message,
                            type: "error",
                            confirmButtonText: "OK",
                            confirmButtonColor: "#424242",
                        });
                    } else {
                        swal({
                            title: "로그인 되었습니다!",
                            type: "success",
                            confirmButtonText: "OK",
                            confirmButtonColor: "#424242",
                        });
                        userLectures = res;
                        renderLectureList();
                        updateLayoutInLogin();
                    }
                });
            }
        });
    });

    // 강의 선택
    $(document).on('click', '.my-lecture', function () {
        let $a = $(this);
        $('.my-lecture').removeClass('collection-item active white-text grey darken-3 my-lecture')
            .addClass('collection-item grey-text text-darken-3 my-lecture');
        $a.attr('class', 'collection-item active white-text grey darken-3 my-lecture')

        const lectureIndex = $a.attr('href').substr(1);
        selectedLecture = userLectures[lectureIndex].lectureName;
        renderChapterList(userLectures[lectureIndex]);
    });

    // 챕터 다운로드
    $(document).on('click', '.lecture-chapter', function () {
        let $a = $(this);
        const chapterIndex = $a.attr('href').substr(1);
        disableAll('강의자료를 다운로드하고 있습니다..');
        klasFD.downloadSelectedFiles(lectureFiles[chapterIndex], selectedLecture, function (res) {
            ableAll();
            swal({
                title: '다운로드 완료',
                text: res,
                type: "success",
                confirmButtonText: "OK",
                confirmButtonColor: "#424242",
            });
        })
    });

    // 강의 전체다운
    $('.downloadAll').click(function () {
        if (userLectures.length === 0) {
            // 강의를 선택해주세요
            swal({
                title: "에러!",
                text: "강의를 선택해주세요!",
                type: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#424242",
            });
        } else if (lectureFiles.length === 0) {
            // 다운할수 있는 파일이 없어요
            swal({
                title: "에러!",
                text: "다운할 수 있는 파일이 없어요!",
                type: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#424242",
            });
        } else {
            // 로딩 시작, 선택 가능한 모든 것들 disabled
            disableAll('전체 강의를 다운로드 중입니다. \n 잠시만 기다려주세요...');
            klasFD.downloadAllFiles(lectureFiles, selectedLecture, function (res) {
                ableAll();
                swal({
                    title: '다운로드 완료',
                    text: res,
                    type: "success",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#424242",
                });
            })
        }
    });

    $('#logout').click(function () {
        localStorage.clear();
        updateLayoutInLogout();
    });

    // 로그인 상태 확인
    function checkLoginState(cb) {
        klasFD.isValidIdPw(localStorage.getItem('id'), localStorage.getItem('pw'), cb);
    }

    // 사용자의 강의 리스트 렌더
    function renderLectureList() {
        console.log(userLectures);
        for (let i in userLectures) {
            $('.lectureCollection')
                .append('<a href="#' + i + '" class="collection-item grey-text text-darken-3 my-lecture">'
                    + userLectures[i].lectureName + '</a>')
        }
    }

    // 선택한 강의의 챕터 렌더
    function renderChapterList(lectureObj) {
        console.log(lectureObj);
        klasFD.getLectureFileLinks(lectureObj, function (fileList) {
            lectureFiles = fileList;
            console.log(fileList);
            $('.chapterCollection').empty();
            if (fileList.length === 0) {
                $('.chapterCollection')
                    .append('<div class="noChapter">해당 강의에서 다운받을 수 있는 자료가 없어요!</div>')
            }
            for (let i in fileList) {
                $('.chapterCollection')
                    .append('<a href="#' + i + '" class="collection-item grey-text text-darken-3 lecture-chapter">'
                        + fileList[i].chapter + '</a>')
            }
        })
    }

    // 로그인 시 레이아웃 변경
    function updateLayoutInLogin() {
        $('.loginForm').hide();
        $('.desc').hide();
        $('.me').attr('style', 'top: 175px;');
        $('.layer').attr('style', 'height: 205px;');
        $('.imageWrapper').attr('style', 'height: 205px;');
        $('.listWrapper').show();
        $('#logout').show();
    }

    // 로그인 시 레이아웃 변경
    function updateLayoutInLogout() {
        $('.loginForm').show();
        $('.desc').show();
        $('.me').attr('style', 'top: 260px;');
        $('.layer').attr('style', 'height: 300px;');
        $('.imageWrapper').attr('style', 'height: 300px;');
        $('.listWrapper').hide();
        $('#logout').hide();
        $('#id').text('');
        $('#pw').text('');
    }

    function disableAll(text) {
        $('#loadingText').text(text);
        $('#loadingText').html($('#loadingText').html().replace(/\n/g, '<br/>'));
        $('.loadingLayer').show();
    }

    function ableAll() {
        $('.loadingLayer').hide();
    }

});