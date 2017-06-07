const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
    .then(createWindowsInstaller)
    .catch((error) => {
        console.error(error.message || error)
        process.exit(1)
    })

function getInstallerConfig () {
    console.log('creating windows installer')
    const rootPath = path.join('./')
    const outPath = path.join(rootPath, 'release-builds')

    return Promise.resolve({
        appDirectory: path.join(outPath, 'KLAS파일다운로더'),
        authors: 'Sung Junyoung',
        noMsi: true,
        outputDirectory: path.join(outPath, 'windows-installer'),
        exe: 'KLAS파일다운로더.exe',
        setupExe: 'KLAS파일다운로더-Installer.exe',
        setupIcon: path.join(rootPath, 'assets', 'icons', 'win', 'logo_256.ico')
    })
}