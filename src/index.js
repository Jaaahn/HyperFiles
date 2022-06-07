// This file is the main file for Electron's main process.

let path = require("path");
const { app, BrowserWindow } = require("electron");

let remoteMain = require("@electron/remote/main");
remoteMain.initialize();

function createWindow() {
    const window = new BrowserWindow({
        width: 2000,
        height: 2000,
        minWidth: 900,
        minHeight: 500,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
        },
        icon: path.join(__dirname, "icons", "icon.iconset", "icon.png"),
    });

    if (app.isPackaged) {
        window.loadFile("vue-dist/index.html");
    } else {
        window.loadURL("http://localhost:3000/");
    }

    /* window.webContents.openDevTools(); */
    remoteMain.enable(window.webContents);
}

app.whenReady().then(() => {
    createWindow();

    // Open new window, if none are existing and the dock icon was clicked (MacOS)
    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
});
