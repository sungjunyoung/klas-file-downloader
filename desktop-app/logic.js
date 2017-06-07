/**
 * Created by junyoung on 2017. 6. 7..
 */


let klasFD = require('./klasFD/module');

let userLectures = [];
$(document).ready(function () {
    // 앱 시작하면 로그인 바로 체크
    // checkLoginState(function(isValid){
    //     if(isValid){
    //         swal({
    //             title: "로그인 되었습니다!",
    //             type: "success",
    //             confirmButtonText: "OK",
    //             confirmButtonColor: "#424242",
    //         });
    //         $('.loginForm').hide();
    //     } else {
    //         // 로그인 실패
    //         swal({
    //             title: "로그인에 실패했습니다!",
    //             text: "다시 로그인해주세요!",
    //             type: "error",
    //             confirmButtonText: "OK",
    //             confirmButtonColor: "#424242",
    //         });
    //     }
    // });

    $('#loginBtn').click(function () {
        let id = $('#id').val();
        let pw = $('#pw').val();

        klasFD.getLectureList(id, pw, function (res) {
            console.log(res);
            if (res.code) {
                // 로그인 실패
                swal({
                    title: "로그인에 실패했습니다!",
                    text: res.message,
                    type: "error",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#424242",
                });

                return;
            } else {
                // 로그인 성공
                localStorage.setItem('id', id);
                localStorage.setItem('pw', pw);

                console.log('LOGIN SUCCESS');
                console.log(localStorage);
                userLectures = res;
            }


        });
    })


    function checkLoginState(cb) {
        klasFD.isValidIdPw(localStorage.getItem('id'), localStorage.getItem('pw'), cb);
    }

});