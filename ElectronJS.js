const {remote} = require('electron')
const React = require('react')

function createTitleBar() {
    const title_bar = `
    <div class="title-div">
        <div class="title-drag"></div>
        <div class="win-btns">
            <a class="win-btn" id="minimize">
                <i class="far fa-window-minimize"></i>
            </a>
            <a class="win-btn" id="maximize">
                <i class="far fa-square"></i>
            </a>
            <a class="win-btn close-btn" id="close">
                <i class="fas fa-times"></i>
            </a>
        </div>
    </div>
    `
    document.getElementsByClassName('body')[0].insertAdjacentHTML('afterbegin', title_bar);
}

function setElectron() {
    createTitleBar();

    document.getElementById('minimize').addEventListener("click", function() {
        remote.getCurrentWindow().minimize();
    })
    
    document.getElementById('maximize').addEventListener("click", function() {
        let current_win = remote.getCurrentWindow();
        if (!current_win.isMaximized()) {
            current_win.maximize();
        } else {
            current_win.unmaximize();
        }
    })
    
    document.getElementById('close').addEventListener("click", function() {
        remote.getCurrentWindow().close();
    })
}

export {
    setElectron as testFunc
}