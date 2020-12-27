const xml = new XMLHttpRequest();
const updateEvent = new Event("update");

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

class Manager {
    constructor() {
        
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
        let itemIndex = null;

        btn.onclick = function() {
            if (!state) {
                dp.style.maxHeight = 140;
                btn.style.borderRadius = "5px 5px 0px 0px"

                state = true;
            } else {
                dp.style.maxHeight = 0;
                dp.addEventListener('transitionend', function cb(event) {
                    console.log("Ended");
                    btn.style.borderRadius = "5px 5px 5px 5px";
                    
                    event.currentTarget.removeEventListener(event.type, cb);
                });

                state = false;
            }
        }

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

            colors.rgb[i] = slider.value;
            rgbBoxes[i].value = slider.value;

            syncHex();
            syncBox();
        }

        let rgbmng = (box, i) => {
            if (box.value <= 255 && box.value >= 0) {
                colors.rgb[i] = box.value;
                slidersBox[i].value = box.value;
            }

            syncHex();
            syncSliders();
            syncBox();
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
    }
}

class ModeManager {
    constructor(dp) {
        var modedp = new DropDownManager('modedp');
        var box = gbi('mode-opts')

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

        const setElements = [
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
                    title: "Speed",
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

        modedp.registerUpdate((data) => {
            box.innerHTML = "";
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
    }
}

function req(info, callback) {
    xml.open(info.method, `${ip}/${info.url}`);
    xml.setRequestHeader('Content-Type', info.type);
    xml.send(info.data);

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

var cookies = document.cookie.split(';')
var arr = {}

cookies.forEach(cookie => {
    let vals = cookie.split('=');
    console.log(vals[0]);
    console.log(vals[1]);
    arr[vals[0]] = vals[1];
});

req({
    method: "GET",
    url: "check",
    type: "text/plain",
    data: arr["API_Token"]
}, function (resText, status, headers) {

})

const manager = new Manager();

window.onload = function() {
    let clrmanager = new ColorManager();
    let mdmanager = new ModeManager();
}