const xml = new XMLHttpRequest();
const updateEvent = new Event("update");
const ip = window.location.origin;

import ColorManager from "./ColorManager.js"
import DeviceManager from "./DeviceManager.js"
import GraphManager from "./GraphManager.js"
import ModeManager from "./ModeManager.js"
import OptionsManager from "./OptionsManager.js"
import PhasesManager from "./PhasesManager.js"
import SwitchManager from "./SwitchManager.js"

function getCookies () {
    var cookies = document.cookie.split(';')
    var arr = {}

    cookies.forEach(cookie => {
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1);
        }

        let ck = cookie.substring(0, cookie.indexOf('='));
        let ck_val = cookie.substring(cookie.indexOf('=') + 1, cookie.length);
        
        arr[ck] = ck_val;
    });

    return arr;
}

function req(info, callback) {
    xml.open(info.method, `${ip}/${info.url}`);

    Object.keys(info.headers).forEach(header => {
        xml.setRequestHeader(header, info.headers[header]);
    });

    if (info.data) xml.send(info.data);
    else xml.send();

    xml.onreadystatechange = function () {
        if (this.readyState == 4) {
            let headers = this.getAllResponseHeaders();
            let arr = headers.trim().split(/[\r\n]+/);

            let headerMap = {};
            arr.forEach(function (line) {
                let parts = line.split(': ');
                let header = parts.shift();
                let value = parts.join(': ');
                headerMap[header] = value;
            });

            callback(this.responseText, this.status, headerMap);
        }
    }
}

var arr = getCookies();

req({
    method: "GET",
    url: "check",
    headers: {
        'Content-Type': 'text/plain',
        'api_token': arr['api_token']
    }
}, function (resText, status, headers) {
    if (status == 404) {
        window.location.pathname = "/";
    }
})

function detectMobile() {
    let devices = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];

    return devices.some((device) => {
        return navigator.userAgent.match(device);
    });
}

window.addEventListener("load", function() {
    if (detectMobile()) {
        document.querySelector(".cnt").style.margin = "100px 0 20px 0";

        let lnv = document.querySelector(".lnv");
        lnv.style.width = 0;
        
        let mbtn = document.querySelector("#menu-btn");
        mbtn.style.display = "flex";
        mbtn.onclick = function() {
            let RECT = lnv.getBoundingClientRect();
            
            if (RECT.width == 0) {
                lnv.style.width = 200;
                mbtn.style.left = 220;
            } else {
                lnv.style.width = 0;
                mbtn.style.left = 20;
            }
        }
    }

    let managers = {}
    managers.graph_mng = new GraphManager(managers);
    managers.dvcmanager = new DeviceManager(managers);
    managers.clrmanager = new ColorManager(managers);
    managers.swmanager = new SwitchManager(managers);
    managers.mdmanager = new ModeManager(managers);
    managers.optmanager = new OptionsManager(managers);
    managers.phasesmanager = new PhasesManager(managers);

    managers.dvcmanager.loadDevices();

    console.log("Window loaded")
}, true)