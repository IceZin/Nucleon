const xml = new XMLHttpRequest();
const ip = window.location.origin;

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

    if (info.frame) xml.send(info.frame);
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

class DeviceManager {
    constructor(managers) {
        let dvcBox = document.getElementById('devices');
        let act_dvc = {
            element: null,
            id: null
        };

        this.loadDevices = function () {
            let cookies = getCookies();

            req({
                method: "GET",
                url: "dvc/getDvcs",
                headers: {
                    "Content-Type": "application/json",
                    "api_token": cookies['api_token']
                }
            }, function (resTxt, status, headers) {
                if (status == 200) {
                    let dvcs = JSON.parse(resTxt);

                    dvcs.forEach(dvc => {
                        managers.dvcmanager.addDevice(dvc);
                    })
                }
            });
        }

        this.addDevice = function (info) {
            let el = `
            <div class="btn">
                <img src="./nano.png">
                <h1>${info.name}</h1>
            </div>
            `
            dvcBox.insertAdjacentHTML('beforeend', el);

            let btn = dvcBox.getElementsByClassName("btn");
            btn = btn[btn.length - 1];

            btn.onclick = function () {
                if (act_dvc.id != info.addr) {
                    if (act_dvc.element != null) act_dvc.element.style.backgroundColor = "transparent";

                    act_dvc.id = info.addr;
                    act_dvc.element = btn;
                    btn.style.backgroundColor = "rgb(91 81 100)";
                } else {
                    btn.style.backgroundColor = "transparent";
                    act_dvc.element = null;
                    act_dvc.id = null;
                }
            }
        }

        this.removeDevice = function (addr) {
            let el = document.getElementById(addr);

            if (el) {
                el.remove();
            }
        }

        let sendCmd = function (frame) {
            req({
                method: "POST",
                url: "dvc/setData",
                headers: {
                    "Content-Type": "application/json",
                    "api_token": getCookies()['api_token']
                },
                frame: JSON.stringify(frame)
            }, function (resTxt, status, headers) {
                if (status == 200) {
                    console.log("[*] Sent data")
                }
            });
        }

        this.sendColor = function() {
            if (act_dvc.id == null) return;

            let clr_type = managers.clrmanager.getType();

            let frame = {
                type: [1, 0, clr_type],
                dvc: act_dvc.id,
                data: managers.clrmanager.getColor()
            }

            sendCmd(frame);
        }

        this.sendPhases = function() {
            if (act_dvc.id == null) return;

            let clr_type = managers.clrmanager.getType();

            let frame = {
                type: [1, 1, clr_type],
                dvc: act_dvc.id,
                data: managers.phasesmanager.getPhases()
            }

            sendCmd(frame);
        }

        this.updateMode = function() {
            if (act_dvc.id == null) return;

            let frame = {
                type: [1, 2],
                dvc: act_dvc.id,
                data: managers.mdmanager.getData()
            }

            sendCmd(frame);
        }
    }
}

export default DeviceManager;