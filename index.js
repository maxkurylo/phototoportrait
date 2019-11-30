const { ipcRenderer } = require('electron')

let originalImage = {}

// ---------- elements -------------

const imageInput = document.getElementById('image-select')
const imageSelectInfo = document.getElementById('image-select-info')
const imageDisplay = document.getElementById('image-display')
const image = document.getElementById('image')
const styleSelect = document.getElementById('style-select')
const stylesList = document.getElementById('styles-list')
const styleLoad = document.getElementById('style-load')
const loading = document.getElementById('loading')
const errorsList = document.getElementById('errors-list')

// ---------- lifecycle ------------

ipcRenderer.send('get-style-images')

ipcRenderer.on('style-images-recieved', (event, recievedStyles) => {
    addStyleItemsToList(recievedStyles)
})

imageInput.onchange = function (e) {
    const fileData = {
        name: e.target.files[0].name,
        path: e.target.files[0].path
    }
    ipcRenderer.send('original-image-upload', fileData)
    hideInput()
}

styleLoad.onchange = function (e) {
    const styleData = {
        name: e.target.files[0].name,
        path: e.target.files[0].path
    }
    ipcRenderer.send('style-image-upload', styleData)
}

ipcRenderer.on('original-image-uploaded', (event, imageData) => {
    originalImage = imageData
    showImage(imageData)
    showStyles()
})

ipcRenderer.on('style-image-uploaded', (event, styleImage) => {
    addStyleImage(styleImage)
})

ipcRenderer.on('styles-applied', (event, imageData) => {
    showImage(imageData)
    toggleLoading()
})

ipcRenderer.on('error', (event, errMessage) => {
    createErrorMessage(errMessage)
})


// --------------- methods -------------------

function addStyleItemsToList(styles) {
    for (let styleImage of styles) {
        const li = createStyleItem(styleImage.path, styleImage.name)
        stylesList.appendChild(li)
    }
}

function createStyleItem(src, alt) {
    const li = document.createElement('li')
    const img = document.createElement('img')
    img.src = src
    img.alt = alt
    li.onclick = styleClick
    li.appendChild(img)
    return li
}

function styleClick(e) {
    let files = {
        original: originalImage,
        style: {
            name: e.target.alt,
            path: e.target.src
        }
    }
    ipcRenderer.send('style-apply', files)
    toggleLoading()
}

function hideInput() {
    imageInput.classList += ' hidden'
    imageSelectInfo.classList += ' hidden'
}

function showImage(imageData) {
    imageDisplay.classList = imageDisplay.classList.value.replace('hidden', '')
    image.src = imageData.path
    image.alt = imageData.name
}

function showStyles() {
    styleSelect.classList.toggle('hidden')
    styleSelect.classList += ' fadeInUp'
}

function addStyleImage(styleImage) {
    const li = createStyleItem(styleImage.path, styleImage.name)
    li.classList = 'animated fadeIn'
    stylesList.insertBefore(li, styleLoad.parentNode.parentNode.nextSibling)
}

function toggleLoading() {
    loading.classList.toggle('hidden');
}

function createErrorMessage(errMessage) {
    const li = document.createElement('li')
    li.classList = 'error-message animated fadeIn'
    const errClose = document.createElement('div')
    errClose.innerText = 'x'
    errClose.onclick = closeError
    errClose.classList = 'error-message-close'
    const p = document.createElement('p')
    p.innerText = errMessage
    li.appendChild(errClose)
    li.appendChild(p)
    errorsList.appendChild(li)
}

function closeError(e) {
    e.target.parentElement.classList.toggle('hidden')
}
