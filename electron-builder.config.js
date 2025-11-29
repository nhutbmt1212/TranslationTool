/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
    appId: 'com.translatetool.app',
    productName: 'Translate Tool',
    directories: {
        output: 'release',
    },
    files: [
        'dist-electron/**/*',
        'dist/**/*',
    ],
    win: {
        target: [
            {
                target: 'portable',
                arch: ['x64'],
            },
        ],
        sign: undefined, // Disable code signing
    },
    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: 'Translate Tool',
    },
};
