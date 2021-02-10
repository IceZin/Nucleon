const xml = new XMLHttpRequest();
const updateEvent = new Event("update");
const ip = window.location.origin

function gbi(id) {
    return document.getElementById(id);
}

function gbc(cl) {
    return document.getElementsByClassName(cl);
}

function giat(id, tpv) {
    let els = document.querySelectorAll(`[tp="${tpv}"]`);
    for (var i = 0; i < els.length; i++) {
        if (id == els[i].id) return i;
    }
}

function gebat(tpv) {
    return document.querySelectorAll(`[tp="${tpv}"]`);
}

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

function sendJSON(url, json, callback) {
    xml.open("POST", `${ip}/${url}`);
    xml.setRequestHeader('Content-Type', 'text/plain');
    xml.send(JSON.stringify(json));

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

        this.sendCmd = function () {
            if (act_dvc.id) {
                let cookies = getCookies();

                let data = {
                    type: "set",
                    dvc: act_dvc.id,
                    color: managers.clrmanager.getColor(),
                    mode: managers.mdmanager.getData()
                }

                console.log(data);

                req({
                    method: "POST",
                    url: "dvc/setData",
                    headers: {
                        "Content-Type": "application/json",
                        "api_token": cookies['api_token']
                    },
                    data: JSON.stringify(data)
                }, function (resTxt, status, headers) {
                    if (status == 200) {
                        console.log("[*] Sent data")
                    }
                });
            }
        }
    }
}

class OptionsManager {
    constructor(managers) {
        let opts = document.getElementsByClassName('opts')[0].childNodes;

        let methods = {
            "set": managers.dvcmanager.sendCmd
        }

        opts.forEach(opt => {
            opt.onclick = function() {
                try {
                    methods[opt.id]();
                } catch (err) {

                }
            }
        });
    }
}

class DropDownManager {
    constructor(dpid) {
        let dpel = gbi(dpid);
        let callbacks = {
            update: []
        }

        let btn = dpel.querySelectorAll('div')[0];
        let dp = dpel.querySelectorAll('div')[1];

        let state = false;
        let activeItem = null;
        
        this.createElements = function (modes) {
            modes.forEach(mode => {
                let el = `<span>${mode}</span>`;
                dp.insertAdjacentHTML('beforeend', el);
            })

            let items = dp.querySelectorAll('span');

            items.forEach(function(item, index) {
                item.onclick = function() {
                    if (item != activeItem) {
                        if (activeItem != null) activeItem.style.backgroundColor = null;

                        activeItem = item;

                        btn.querySelector('span').innerHTML = item.innerHTML;
                        item.style.backgroundColor = "#6896A0";

                        callbacks.update.forEach(cb => {
                            cb(index);
                        });
                    }
                }
            });
        }

        btn.onclick = function() {
            if (!state) {
                let count = dpel.querySelectorAll('span').length;
                dp.style.maxHeight = count * 30;
                btn.style.borderRadius = "5px 5px 0px 0px"

                state = true;
            } else {
                dp.style.maxHeight = 0;
                dp.addEventListener('transitionend', function cb(event) {
                    btn.style.borderRadius = "5px 5px 5px 5px";
                    
                    event.currentTarget.removeEventListener(event.type, cb);
                });

                state = false;
            }
        }

        this.registerUpdate = function(callback) {
            callbacks.update.push(callback)
        }
    }
}

class ColorManager {
    constructor() {
        let colors = {
            'hex': '000000',
            'rgb': [0, 0, 0]
        }
        let callbacks = {};

        let slidersBox = gbc('it1')[0].querySelectorAll('input[type=range]');
        let hex = gbc('hex')[0].querySelector('input');
        let rgbBoxes = gbc('rgb')[0].querySelectorAll('input');

        let syncBox = () => {
            gbc('it1')[0].querySelector('div[class=el3]').querySelector('div').style.backgroundColor = '#' + colors.hex;
        }

        let syncHex = () => {
            let clr = "";

            for (let i = 0; i < 3; i++) {
                let hex = parseInt(colors.rgb[i]).toString(16).toUpperCase();
                if (hex.length < 2) hex = '0' + hex;
                clr += hex;
            }

            hex.value = clr;
            colors.hex = clr;
        }

        let syncSliders = () => {
            slidersBox.forEach(slider => {
                let len = (100 * slider.value) / 255;
                slider.style.background = `linear-gradient(90deg, rgb(201, 238, 242) ${len}%, rgb(197, 197, 197) ${len}%)`
            });
        }

        let slidermng = (slider, i) => {
            let len = (100 * slider.value) / 255;
            slider.style.background = `linear-gradient(90deg, rgb(201, 238, 242) ${len}%, rgb(197, 197, 197) ${len}%)`

            colors.rgb[i] = parseInt(slider.value);
            rgbBoxes[i].value = slider.value;

            syncHex();
            syncBox();

            updateCallbacks();
        }

        let rgbmng = (box, i) => {
            if (box.value <= 255 && box.value >= 0) {
                colors.rgb[i] = parseInt(box.value);
                slidersBox[i].value = box.value;
            }

            syncHex();
            syncSliders();
            syncBox();

            updateCallbacks();
        }

        let hexmng = (hex) => {
            try {
                let hexval = parseInt(hex.value, 16);

                for (let i = 0; i < 3; i++) {
                    let clr = (hexval >> ((2 - i) * 8)) & 255;
                    colors.rgb[i] = clr;
                    slidersBox[i].value = clr;
                    rgbBoxes[i].value = clr;
                }

                colors.hex = hex.value;

                syncSliders();
                syncBox();

                updateCallbacks();
            } catch (err) {
                console.log(err);
            }
        }

        hex.oninput = function() {
            hexmng(this);
        }

        rgbBoxes.forEach(function(box, index) {
            box.oninput = function() {
                rgbmng(this, index);
            }
        });

        slidersBox.forEach(function(slider, index) {
            slider.oninput = function() {
                slidermng(this, index);
            }; 
        });

        this.getColor = () => {
            return colors.rgb;
        }

        let updateCallbacks = function() {
            Object.keys(callbacks).forEach(addr => {
                callbacks[addr](colors.rgb);
            })
        }

        this.registerCallback = function(address, callback) {
            callbacks[address] = callback;
        }

        this.unregisterCallback = function(address) {
            delete callbacks[address];
        }
    }
}

class ModeManager {
    constructor() {
        var modedp = new DropDownManager('modedp');
        var box = gbi('mode-opts');
        var activeMode = 0;

        let createElement = (info) => {
            let el = `<div id="m-info" class="el1">
                <div>
                    <h1>${info.title}</h1>
                    <h1>${info.value}</h1>
                </div>
                <input type="range" min="${info.min}" max="${info.max}" value="0"></input>
            </div>`

            box.insertAdjacentHTML('beforeend', el);
        }

        const modes = [
            "Clear",
            "Solid",
            "Fade",
            "Chroma",
            "Spectrum"
        ]

        const setElements = [
            [],
            [
                {
                    title: "Intensity",
                    value: "0",
                    min: 0,
                    max: 100
                }
            ],
            [
                {
                    title: "Intensity",
                    value: "0",
                    min: 0,
                    max: 100
                },
                {
                    title: "Speed",
                    value: "0",
                    min: 0,
                    max: 100
                }
            ],
            [
                {
                    title: "Intensity",
                    value: "0",
                    min: 0,
                    max: 100
                },
                {
                    title: "Speed",
                    value: "0",
                    min: 0,
                    max: 100
                }
            ],
            [
                {
                    title: "Intensity",
                    value: "0",
                    min: 0,
                    max: 100
                },
                {
                    title: "Brightness Decay",
                    value: "0",
                    min: 0,
                    max: 100
                },
                {
                    title: "Sound Cutoff",
                    value: "0",
                    min: 0,
                    max: 1023
                },
                {
                    title: "Max Sound Intensity",
                    value: "0",
                    min: 0,
                    max: 1023
                }
            ]
        ]

        modedp.createElements(modes);

        modedp.registerUpdate((data) => {
            box.innerHTML = "";
            activeMode = data;
            setElements[data].forEach(el => {
                createElement(el)
            })

            document.getElementsByClassName("el1")
            document.querySelectorAll('[id="m-info"]').forEach(el => {
                let title = el.getElementsByTagName('h1')[1];
                let slider = el.getElementsByTagName('input')[0];

                slider.oninput = function() {
                    let len = (100 * slider.value) / slider.max;
                    slider.style.background = `linear-gradient(90deg, rgb(201, 238, 242) ${len}%, rgb(197, 197, 197) ${len}%)`

                    title.innerHTML = slider.value;
                }
            })
        })

        this.getData = function () {
            let data = {
                type: activeMode,
                values: []
            }

            box.querySelectorAll('input').forEach(function (slider, index) {
                if (setElements[activeMode][index].max == 1023) {
                    let val = parseInt(slider.value);

                    for (let i = 0; i < 5; i++) {
                        if (val >= 255) {
                            data.values.push(255);
                            val -= 255;
                        } else if (val > 0 && val < 255) {
                            data.values.push(val);
                            val = 0;
                        } else {
                            data.values.push(0);
                        }
                    }
                } else {
                    data.values.push(parseInt(slider.value));
                }
            });

            return data;
        }
    }
}

class PhasesManager {
    constructor(managers) {
        let phasesBox = document.getElementById("phasebox");
        let phasesContent = phasesBox.querySelector(".phases");
        let phases = phasesBox.querySelectorAll(".phase");

        let activePhase;
        let phase_i;
        let phasesColor = [];
        
        phasesBox.querySelector('#add').onclick = function() {
            let color = managers.clrmanager.getColor();
            let ph_i = phases.length;

            let phase = `
            <div class="phase">
                <div id="name">
                    <h1>Phase ${ph_i + 1}</h1>
                </div>
                <div id="color">
                    <div>${color[0]}</div>
                    <div>${color[1]}</div>
                    <div>${color[2]}</div>
                </div>
            </div>
            `;

            phasesContent.insertAdjacentHTML('beforeend', phase);
            phases = phasesBox.querySelectorAll(".phase");

            phase = phases[ph_i];

            phasesColor.push(Array.from(color));

            phase.onclick = function() {
                let label = phase.querySelector("#name");
                
                for (let i = 0; i < phases.length; i++) {
                    if (phases[i] == phase) {
                        ph_i = i;
                        break;
                    }
                }

                if (activePhase == null) {
                    label.style.width = 140;
                    label.style.backgroundColor = "#258eb8";

                    activePhase = phase;
                    phase_i = ph_i;

                    enableColorSync(ph_i);
                } else {
                    if (activePhase != phase) {
                        activePhase.querySelector("#name").style.width = 80;
                        activePhase.querySelector("#name").style.backgroundColor = "#585d7f";

                        label.style.width = 140;
                        label.style.backgroundColor = "#258eb8";

                        disableColorSync(phase_i);

                        activePhase = phase;
                        phase_i = ph_i;

                        enableColorSync(ph_i);
                    } else {
                        label.style.width = 80;
                        label.style.backgroundColor = "#585d7f";

                        activePhase = null;
                        phase_i = null;

                        disableColorSync(ph_i);
                    }
                }
            } 
        }

        phasesBox.querySelector("#remove").onclick = function() {
            if (activePhase) {
                activePhase.remove();
                phases = phasesBox.querySelectorAll(".phase");

                disableColorSync(phase_i);
                adjustIndexes(phase_i);

                phasesColor.splice(phase_i, 1);

                activePhase = null;
                phase_i = null;
            }
        }

        let enableColorSync = function(index) {
            managers.clrmanager.registerCallback(`phase${index}`, function(color) {
                let clr_divs = phases[index].querySelectorAll("#color div");
                let i = 0;

                clr_divs.forEach(div => {
                    div.innerHTML = color[i++];
                });

                phasesColor[index] = Array.from(color);
            });
        }

        let disableColorSync = function(index) {
            managers.clrmanager.unregisterCallback(`phase${index}`);
        }

        let adjustIndexes = function(index) {
            for (let i = index; i < phases.length; i++) {
                phases[i].querySelector("#name h1").innerHTML = "Phase " + (i + 1);
            }
        }

        let getPhases = function() {

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
    let managers = {}
    managers.dvcmanager = new DeviceManager(managers);
    managers.clrmanager = new ColorManager(managers);
    managers.mdmanager = new ModeManager(managers);
    managers.optmanager = new OptionsManager(managers);
    managers.phasesmanager = new PhasesManager(managers);

    managers.dvcmanager.loadDevices();

    console.log("Window loaded")
}, true)