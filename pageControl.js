var active_modal = null;
var active_dvc = null;
var fadeSide = null;
var active_slider;
var devices = {};
var light_inter;
var lightChart;
const xml = new XMLHttpRequest();
const ip = "http://nucleon.azurewebsites.net";
var options = {
    hostname: ip,
    port: 8080
}

window.onload = function() {
    document.getElementsByClassName('left-nav')[0].querySelectorAll('a').forEach(element => {
        element.onclick = options_click;
    });
    setModes();
    setSliders();
    setButtons();
    drawChart();
    getDevices();
    if (navigator.userAgent.indexOf('Electron') >= 0) {
        import('/ElectronJS.js').then(lib => {
            lib.testFunc();
        })
    }
    document.getElementById('option-modal').style.visibility = "visible";
    document.getElementById('option-modal').style.opacity = 1;
}

function setModes() {
    var checkbtns = document.getElementsByClassName("modes")[0].querySelectorAll("input");
    checkbtns.forEach(btn => {
        btn.onclick = dvcMode;
    })
}

function setButtons() {
    var buttons = document.getElementsByClassName("opt-btn");
    console.log(buttons);
    Array.from(buttons).forEach(btn => {
        btn.onclick = deviceSend;
    })
    let rgb_side = document.getElementsByClassName("grad-container")[0].querySelectorAll('input');
    rgb_side.forEach(btn => {
        btn.onclick = fadeCtrl;
    })
}

function setSliders() {
    var r_slider = document.getElementById('red-slider');
    var g_slider = document.getElementById('green-slider');
    var b_slider = document.getElementById('blue-slider');
    var vel_slider = document.getElementById('vel-slider');
    var len_slider = document.getElementById('len-slider');
    let grad = document.getElementsByClassName('grad')[0].style;
    r_slider.oninput = function() {
        document.getElementById('red').innerHTML = r_slider.value;
        if (active_dvc != null) {
            let dvc_params = devices[active_dvc].params;
            dvc_params[fadeSide][0] = r_slider.value;
            document.getElementById(fadeSide).style.backgroundColor = `rgb(${dvc_params[fadeSide].join(',')})`;
            grad.backgroundImage = `linear-gradient(to right, rgb(${dvc_params['RGBs'].join(',')}), rgb(${dvc_params['RGBe'].join(',')}))`;
        }
    }
    g_slider.oninput = function() {
        document.getElementById('green').innerHTML = g_slider.value;
        if (active_dvc != null) {
            let dvc_params = devices[active_dvc].params;
            dvc_params[fadeSide][1] = g_slider.value;
            document.getElementById(fadeSide).style.backgroundColor = `rgb(${dvc_params[fadeSide].join(',')})`;
            grad.backgroundImage = `linear-gradient(to right, rgb(${dvc_params['RGBs'].join(',')}), rgb(${dvc_params['RGBe'].join(',')}))`;
        }
    }    
    b_slider.oninput = function() {
        document.getElementById('blue').innerHTML = b_slider.value;
        if (active_dvc != null) {
            let dvc_params = devices[active_dvc].params;
            dvc_params[fadeSide][2] = b_slider.value;
            document.getElementById(fadeSide).style.backgroundColor = `rgb(${dvc_params[fadeSide].join(',')})`;
            grad.backgroundImage = `linear-gradient(to right, rgb(${dvc_params['RGBs'].join(',')}), rgb(${dvc_params['RGBe'].join(',')}))`;
        }
    }
    vel_slider.oninput = function() {
        if (vel_slider.value == 0) document.getElementById('vel').innerHTML = "Max";
        else document.getElementById('vel').innerHTML = `${(1000 / vel_slider.value).toFixed(2)}Hz`;
        if (active_dvc != null) {
            let dvc_params = devices[active_dvc].params;
            dvc_params.speed = vel_slider.value;
        }
    }
    len_slider.oninput = function() {
        document.getElementById('len').innerHTML = len_slider.value;
        if (active_dvc != null) {
            let dvc_params = devices[active_dvc].params;
            dvc_params.length = len_slider.value;
        }
    }
}

function getDevices() {
    xml.open("GET", `${ip}/api/devices`);
    xml.send();
    xml.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 200) {
            let dvcs = JSON.parse(this.responseText);
            let div = document.getElementById('dvcs');
            div.childNodes.forEach(function(value, i) {
                if (Object.keys(devices).includes(value.id)) return;
                if (value != div.querySelector('.dvc-title')) {
                    div.removeChild(value);
                }
            })
            dvcs.forEach(dvc => {
                if (Object.keys(devices).includes(dvc)) return;
                addClient(dvc, 'dvcs');
            })
        }
    }
}

function addClient(client, type) {
    var dvc_check = `
        <div id=${client}>
            <input class="check_btn" type="checkbox"></input>
            <h1>${client}</h1>
        </div>
    `

    document.getElementById(type).insertAdjacentHTML('beforeend', dvc_check);
    document.getElementById(client).querySelector('input').onclick = selectDevice;

    if (type == 'dvcs') {
        devices[client] = {
            'type': 'sub',
            'params': {
                'RGBs': [0,0,0],
                'RGBe': [0,0,0],
                'state': false,
                'mode': null,
                'speed': 0,
                'length': 0
            },
            'APs': {}
        };
    }
}

function options_click() {
    console.log(this.id);
    if (this.id == "options") {
        if (active_dvc) {
            controlModal("option-modal");
        }
    } else if (this.id == "charts") {
        controlModal("chart-modal");
        //getLigthInfo();
        //light_inter = setInterval(getLigthInfo, 5000);
    } else if (this.id == "wifi") {
        controlModal("wifi-modal");
        if (active_dvc != null && active_modal != null) {
            updateWiFi();
        }
    } else if (this.id == "devices") {
        if (active_slider == null) {
            getDevices();
            openDvcs();
            active_slider = this.id;
        } else {
            closeDvcs();
            active_slider = null;
        }
    } else if (this.id == "set") {
        deviceSend(this.id);
    } else if (this.id == "clear") {
        deviceSend(this.id);
    }
}

function controlModal(modal) {
    if (active_modal == modal) {
        console.log("Hiding");
        hideModal(modal);
        active_modal = null;
    } else if (active_modal == null) {
        console.log("Showing");
        showModal(modal)
        active_modal = modal;
    } else {
        console.log("Changing");
        hideModal(active_modal);
        showModal(modal);
        active_modal = modal;
    }
}

function showModal(modal) {
    document.getElementById(modal).style.visibility = "visible";
    document.getElementById(modal).style.opacity = 1;
}

function hideModal(modal) {
    document.getElementById(modal).style.visibility = "hidden";
    document.getElementById(modal).style.opacity = 0;
}

function drawChart() {
    var ctx = document.getElementById('myChart');
    
    lightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Light',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor:'rgba(255, 99, 132, 1)',
                borderWidth: 2
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            legend: {
                labels: {
                    fontColor: 'rgba(255, 255, 255, 1)',
                    fontFamily: 'Montserrat'
                }
            },
            scales: {
                yAxes: [{
                    display: true,
                    ticks: {
                        beginAtZero: true,
                        steps: 10,
                        max: 1000,
                        fontColor: 'rgba(255, 255, 255, 1)'
                    }
                }]
            }
        }
    });
}

function clearChart() {
    lightChart.data.labels = [];
    lightChart.data.datasets[0].data = [];
    lightChart.update();
}

function getLigthInfo() {
    lightChart.data.labels = [];
    lightChart.data.datasets[0].data = [];
    sendJSON("api/device/lightinfo", JSON.stringify(devices[active_dvc]), function(l_data, res_sts) {
        if (res_sts == 200) {
            l_data = JSON.parse(l_data);
            Object.keys(l_data).forEach(time => {
                lightChart.data.labels.push(time);
                lightChart.data.datasets[0].data.push(l_data[time]);
            });
            lightChart.update();
            console.log(lightChart.data.labels);
            console.log(lightChart.data.datasets[0].data);
        } else {
            clearInterval(light_inter);
            console.log("Error closed");
        }
    });
}

function sendJSON(url, json, callback) {
    xml.open("POST", `${ip}/${url}`);
    xml.setRequestHeader('Content-Type', 'text/plain');
    console.log(devices[active_dvc]);
    xml.send(JSON.stringify(json));
    xml.onreadystatechange = function(){
        if(this.readyState == 4) {
            callback(this.responseText, this.status);
        }
    }
}

function openDvcs() {
    document.getElementById('dvcs-list').style.width = "180px";
}

function closeDvcs() {
    document.getElementById('dvcs-list').style.width = "0";
}

function selectDevice(){
    if (this.checked) {
        if (active_dvc != null) {
            document.getElementById(active_dvc).querySelector('input').checked = false;
            //clearInterval(light_inter);
        }
        active_dvc = this.parentNode.id;
        if (devices[this.parentNode.id].type == 'sub') {
            deviceAttr();
            //getLigthInfo();
            //light_inter = setInterval(getLigthInfo, 5000);
        }
    } else {
        active_dvc = null;
        //clearInterval(light_inter);
        clearChart();
    }
    console.log(active_dvc);
}

function dvcMode() {
    var checkbtns = document.getElementsByClassName("modes")[0].querySelectorAll("input");
    checkbtns.forEach(btn => {
        if (btn.id != this.id) {
            btn.checked = false;
        }
    })
    
    if (active_dvc != null) {
        console.log(this.id);
        devices[active_dvc].params.mode = this.id;
    }
}

function deviceSend(id) {
    console.log(id);
    console.log(active_dvc);

    if (active_dvc != null) {
        console.log("Sending mode");

        if (id == "set") {
            console.log('sending');
            updateClientData();
            devices[active_dvc].params.state = true;
        } else {
            devices[active_dvc].params.state = false;
        }

        console.log(devices[active_dvc].params)
        sendJSON(`api/device/data`, {[active_dvc]: devices[active_dvc]});
    }
}

function updateClientData() {
    if (devices[active_dvc].type == 'atk') {
        devices[active_dvc].targets = getTargets();
        console.log(devices[active_dvc].targets);

        if (devices[active_dvc].params.mode == 'scanNetworks') setTimeout(updateWiFi, 3000);
    }
}

function getTargets() {
    let targets = [];

    document.getElementById('wifi-modal').querySelectorAll('input').forEach(function(target, i) {
        if (target.checked) targets.push(i);
    })

    return targets;
}

function deviceAttr() {
    var r = document.getElementById('red-slider').value;
    var g = document.getElementById('green-slider').value;
    var b = document.getElementById('blue-slider').value;
    var spd = document.getElementById('vel-slider').value;
    var len = document.getElementById('len-slider').value;

    devices[active_dvc].params.RGBs = [r, g, b];
    devices[active_dvc].params.speed = spd;
    devices[active_dvc].params.length = len;
}

function updateWiFi() {
    document.getElementById('wifi-modal').innerHTML = "";

    xml.open("GET", `${ip}/api/devices/aps?dvc=${active_dvc}`);
    xml.send();
    xml.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 200) {
            let res = JSON.parse(this.responseText);
            console.log(res);

            res.APs.forEach(ap => {
                let rssi = Math.abs(parseInt(ap.RSSI));
                let color = "c10000";

                if (rssi <= 60) {
                    color = "#00b100";
                } else if (rssi > 60 && rssi <= 70) {
                    color = "#ff6700"
                }

                var wifi_dvc = `<div class="wifi-element">
                    <input id="spectrumctrl" class="check_btn" type="checkbox"></input>
                    <h1>SSID:</h1>
                    <h1>${ap.SSID}</h1>
                    <div class="wifi-separator"></div>
                    <h1>RSSI:</h1>
                    <div class="RSSI-bar">
                        <div class="RSSI-progress" style="width: ${rssi}%; background-color: ${color}"></div>
                        <h1>${ap.RSSI}</h1>
                    </div>
                    <div class="wifi-separator"></div>
                    <h1>BSSID:</h1>
                    <h1>${ap.BSSID}</h1>
                    <div class="wifi-separator"></div>
                    <h1>CHANNEL:</h1>
                    <h1>${ap.CH}</h1>
                </div>`
                document.getElementById('wifi-modal').insertAdjacentHTML('beforeend', wifi_dvc);
            });
        }
    }
}

function ap_hdl() {
    let btns = document.getElementById('wifi-modal').getElementsByTagName('input');
    let targets = [];

    for (let i = 0; i < btns.length; i++) {
        if (btns[i].checked) targets.push(i);
    }

    sendJSON(`/api/device/deauth?dvc=${active_dvc}`, targets);
}

function fadeCtrl() {
    if (fadeSide != this.id) {
        console.log(fadeSide);
        fadeSide = this.id;
        let dvc_params = devices[active_dvc].params;
        document.getElementById('red-slider').value = dvc_params[fadeSide][0];
        document.getElementById('green-slider').value = dvc_params[fadeSide][1];
        document.getElementById('blue-slider').value = dvc_params[fadeSide][2];
        document.getElementById('red').innerHTML = dvc_params[fadeSide][0];
        document.getElementById('green').innerHTML = dvc_params[fadeSide][1];
        document.getElementById('blue').innerHTML = dvc_params[fadeSide][2];
    }
}