const {app, BrowserView, BrowserWindow} = require('electron')

function createWindow() {
    let win = new BrowserWindow({
        width: 1500,
        height: 900,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        },
        center: true
    })

    win.loadURL('http://192.168.0.8:1108/');
    win.webContents.openDevTools();
}

app.whenReady().then(createWindow);