const { app, BrowserWindow } = require('electron')
const { ipcMain } = require('electron')
const fs = require('fs')

const images = {
    originals: 'images/originals/',
    styles: 'images/styles/',
    stylized: 'images/stylized/',
}

app.on('ready', createWindow)

function createWindow() {
    let win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true
        }
    })

    win.loadFile('index.html')
    //win.webContents.toggleDevTools();
    initEvents();
}


function initEvents() {
    ipcMain.on('get-style-images', (event) => {
        getStyleImages()
            .then(resp => event.reply('style-images-recieved', resp))
            .catch(err => event.reply('error', err))
    })

    ipcMain.on('original-image-upload', (event, fileData) => {
        const writePath = images.originals + fileData.name
        uploadFile(fileData.path, writePath)
            .then(() => {
                const imageData = { name: fileData.name, path: writePath }
                event.reply('original-image-uploaded', imageData)
            })
            .catch(err => event.reply('error', err))
    })

    ipcMain.on('style-image-upload', (event, fileData) => {
        const writePath = images.styles + fileData.name
        uploadFile(fileData.path, writePath)
            .then(() => {
                const styleData = { name: fileData.name, path: writePath }
                event.reply('style-image-uploaded', styleData)
            })
            .catch(err => event.reply('error', err))
    })

    ipcMain.on('style-apply', (event, files) => {
        let stylizedName = files.original.name + files.style.name + '.jpeg'
        let savePath = images.stylized + stylizedName
        runPython(files.original.path, files.style.path, savePath)
            .then((e) => {
                const imageData = { name: stylizedName, path: savePath }
                event.reply('styles-applied', imageData)
            })
            .catch(err => event.reply('error', err))
    })
}


function getStyleImages() {
    return new Promise((resolve, reject) => {
        fs.readdir(images.styles, (err, resp) => {
            if (err)
                reject('fs: ' + err)
            const styles = []
            for (fileName of resp)
                if (fileName.includes('.png') || fileName.includes('.jpeg') || fileName.includes('.jpg'))
                    styles.push({ name: fileName, path: images.styles + fileName })
            resolve(styles)
        })
    })
}


function uploadFile(readPath, writePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(readPath, (err, data) => {
            if (err)
                reject(err)
            fs.writeFile(writePath, data, err => {
                if (err)
                    reject('fs: ' + err)
                resolve()
            })
        })
    })
}


function runPython(original, style, savePath) {
    return new Promise((resolve, reject) => {
        const python = require('child_process').spawn('python', ['stylizer.py', original, style, savePath]);
        python.stdout.on('data', function (data) {
            data = data.toString('utf8')
            if (data.includes('ERROR')) {
                reject('Python: ' + data)
            }
            resolve(data)
        });
    });

}