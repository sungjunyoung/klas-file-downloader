/**
 * Created by junyoung on 2017. 6. 7..
 */


var klasFD = require('./klasFD/module');


$(document).ready(function(){

    $('.testBtn').click(function(){
        klasFD.getLectureList('2012104095', 'Sung167300', function(res){
            console.log(res);
            var lectureLinkObj = res[2];
            klasFD.getLectureFileLinks(lectureLinkObj, function(res){
                console.log(res);
            })
        });
    })



});