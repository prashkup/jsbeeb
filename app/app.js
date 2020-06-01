"use strict";
const {app, Menu, BrowserWindow} = require('electron');
const fs = require('fs');
const path = require('path');
const {ArgumentParser} = require('argparse');

const isMac = process.platform === 'darwin';

function getArguments() {
    // Heinous hack to get "built" versions working
    if (path.basename(process.argv[0]) === 'jsbeeb') // Is this ia "built" version?
        return process.argv.slice(1);
    return process.argv.slice(2);
}

const parser = new ArgumentParser({
    prog: 'jsbeeb',
    addHelp: true,
    description: 'Emulate a Beeb'
});
parser.addArgument(["--noboot"], {action: 'storeTrue', help: "don't autoboot if given a disc image"});
parser.addArgument(["disc1"], {nargs: '?', help: "image to load in drive 0"});
parser.addArgument(["disc2"], {nargs: '?', help: "image to load in drive 1"});
const args = parser.parseArgs(getArguments());


function getFileParam(filename) {
    try {
        return "file://" + fs.realpathSync(filename);
    } catch (e) {
        console.error("Unable to open file " + filename);
        throw e;
    }
}

async function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 1024,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    const query = {};
    if (args.disc1 && !args.noboot) query.autoboot = true;
    if (args.disc1) query.disc1 = getFileParam(args.disc1);
    if (args.disc2) query.disc2 = getFileParam(args.disc2);
    await win.loadFile('index.html', {query});

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
}

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(createWindow)
    .catch(e => {
        console.error("Unhandled exception", e);
        app.exit(1);
    });


const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
        label: app.name,
        submenu: [
            {role: 'about'},
            {type: 'separator'},
            {role: 'services'},
            {type: 'separator'},
            {role: 'hide'},
            {role: 'hideothers'},
            {role: 'unhide'},
            {type: 'separator'},
            {role: 'quit'}
        ]
    }] : []),
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            isMac ? {role: 'close'} : {role: 'quit'}
        ]
    },
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: [{role: 'paste'}]
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            {role: 'reload'},
            {role: 'forcereload'},
            {role: 'toggledevtools'},
            {type: 'separator'},
            {role: 'resetzoom'},
            {role: 'zoomin'},
            {role: 'zoomout'},
            {type: 'separator'},
            {role: 'togglefullscreen'}
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: async () => {
                    const {shell} = require('electron');
                    await shell.openExternal('https://github.com/mattgodbolt/jsbeeb/');
                }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
