const { app, BrowserWindow } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 1800,
    height: 1100,
    webPreferences: {
      nodeIntegration: false // changed from default == true
    }
  })
  win.webContents.openDevTools()
  win.loadFile('index.html')
}

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
