var electronInstaller = require('electron-winstaller');

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: './release-builds/klasfd-desktop-app-win32-x64',
    outputDirectory: './release-builds/klasfd-desktop-app-installer',
    exe: 'klasfd-desktop-app.exe',
    setupExe: 'KLASFD-Setup.exe',
    author: '성준영',
    description: 'KLAS 강의자료 손쉽게 다운받기'
});

resultPromise.then(function () {
    console.log("It worked!");
}, function (e) {
    console.log('No dice: ' + e.message);
    console.log(e);
});
