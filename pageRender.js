const {app, BrowserWindow} = require('electron')

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 1500,
        height: 900,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    })

    win.loadFile('page.html');
    win.webContents.openDevTools();
})