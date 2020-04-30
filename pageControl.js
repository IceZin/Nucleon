var active_modal = null;
var active_dvc = null;
var active_slider;
var devices = [];
var devices_addr = [];
const xml = new XMLHttpRequest();
var light_inter;

window.onload = function() {
    document.getElementsByClassName('left-nav')[0].querySelectorAll('a').forEach(element => {
        element.onclick = options_click;
    });
    setModes();
    setSliders();
    setButtons();
    drawChart();
    getDevices();
}

function setModes() {
    var checkbtns = document.getElementsByClassName("modes")[0].querySelectorAll("input");
    checkbtns.forEach(btn => {
        btn.onclick = deviceMode;
    })
}

function setButtons() {
    var buttons = document.getElementsByClassName("opt-btn");
    console.log(buttons);
    Array.from(buttons).forEach(btn => {
        btn.onclick = deviceSend;
    })
}

function setSliders() {
    var r_slider = document.getElementById('red-slider');
    var g_slider = document.getElementById('green-slider');
    var b_slider = document.getElementById('blue-slider');
    var vel_slider = document.getElementById('vel-slider');
    var len_slider = document.getElementById('len-slider');
    var lon_slider = document.getElementById('lon-slider');
    var loff_slider = document.getElementById('loff-slider');
    r_slider.oninput = function() {
        document.getElementById('red').innerHTML = r_slider.value;
        if (active_dvc != null) {
            devices[active_dvc].RGB[0] = r_slider.value;
        }
    }
    g_slider.oninput = function() {
        document.getElementById('green').innerHTML = g_slider.value;
        if (active_dvc != null) {
            devices[active_dvc].RGB[1] = g_slider.value;
        }
    }    
    b_slider.oninput = function() {
        document.getElementById('blue').innerHTML = b_slider.value;
        if (active_dvc != null) {
            devices[active_dvc].RGB[2] = b_slider.value;
        }
    }
    vel_slider.oninput = function() {
        document.getElementById('vel').innerHTML = vel_slider.value;
        if (active_dvc != null) {
            devices[active_dvc].speed = vel_slider.value;
        }
    }
    len_slider.oninput = function() {
        document.getElementById('len').innerHTML = len_slider.value;
        if (active_dvc != null) {
            console.log(devices[active_dvc]);
            devices[active_dvc].length = len_slider.value;
        }
    }
    lon_slider.oninput = function() {
        document.getElementById('lon').innerHTML = lon_slider.value;
        if (active_dvc != null) {
            console.log(devices[active_dvc]);
            devices[active_dvc].light_on = lon_slider.value;
        }
    }
    loff_slider.oninput = function() {
        document.getElementById('loff').innerHTML = loff_slider.value;
        if (active_dvc != null) {
            console.log(devices[active_dvc]);
            devices[active_dvc].light_off = loff_slider.value;
        }
    }
}

function getDevices() {
    xml.open("GET", 'http://191.182.22.15:1108/api/devices');
    xml.send();
    xml.onreadystatechange = function(){
        if(this.readyState == 4 && this.status == 200) {
            var dvcs_con = JSON.parse(this.responseText).connected;
            var div = document.getElementsByClassName('devices-nav')[0];
            var childs = div.childNodes;
            for (var i = 0; i < div.childElementCount; i++) {
                if (!dvcs_con.includes(childs[i].querySelector('h1').innerHTML)) {
                    div.removeChild(childs[i]);
                    delete devices_addr[childs[i].querySelector('h1').innerHTML];
                }
            }
            var i = div.childElementCount;
            dvcs_con.forEach(client_addr => {
                if (!devices_addr.includes(client_addr)) {
                    addClient(client_addr, i);
                    devices_addr.push(client_addr);
                    i++;
                }
            })
        }
    }
}

function addClient(client, index) {
    var div = document.getElementsByClassName('devices-nav')[0];
    var div2 = document.createElement('div');
    var btn = document.createElement('input');
    var h1 = document.createElement('h1');

    btn.id = `dvc-${index}`;
    btn.className = "check_btn";
    btn.type = "checkbox";
    btn.onclick = selectDevice;

    h1.innerHTML = client;

    div2.appendChild(btn);
    div2.appendChild(h1);

    div.appendChild(div2);

    devices.push({
        'name': client,
        'device': index,
        'state': false,
        'mode': null,
        'speed': 0,
        'length': 0,
        'light_on': 0,
        'light_off': 0,
        'RGB': []
    });
}

function addAP(ssid, rssi, bssid) {
    var wifi_modal = document.getElementById("wifi-modal");
    var div = document.createElement('div');
    div.className = "wifi-element";

    var h1 = document.createElement('h1');
    h1.innerHTML = "SSID:"
    div.appendChild(h1);

    h1.innerHTML = ssid;
    div.appendChild(h1)

    var separator = document.createElement('div');
    separator.className = "wifi-separator";
    div.appendChild(separator);

    h1.innerHTML = "RSSI:";
    div.appendChild(h1);

    var rssi_bar = document.createElement('div');
    rssi_bar.className = "RSSI-bar";
    var rssi_progress = document.createElement('div');
    rssi_progress.className = "RSSI-progress";
    rssi_bar.appendChild(rssi_progress);
    div.appendChild(rssi_bar);
    h1.innerHTML = rssi;
    div.appendChild(h1);

    div.appendChild(separator);

    h1.innerHTML = "BSSID:";
    div.appendChild(h1);

    h1.innerHTML = bssid;
    div.appendChild(h1);

    wifi_modal.appendChild(div);
}

function options_click() {
    console.log(this.id);
    if (this.id == "options") {
        controlModal("option-modal");
    } else if (this.id == "charts") {
        controlModal("chart-modal");
        //getLigthInfo();
        //light_inter = setInterval(getLigthInfo, 5000);
    } else if (this.id == "wifi") {
        controlModal("wifi-modal");
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
    sendJSON("api/device/lightinfo", function(l_data, res_sts) {
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

function sendJSON(url, callback) {
    xml.open("POST", `http://191.182.22.15:1108/${url}`);
    xml.setRequestHeader('Content-Type', 'application/json');
    console.log(devices[active_dvc]);
    xml.send(JSON.stringify(devices[active_dvc]));
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
            document.getElementById(`dvc-${active_dvc}`).checked = false;
            clearInterval(light_inter);
        }
        active_dvc = parseInt(this.id.substring(4, this.id.length));
        deviceAttr();
        getLigthInfo();
        light_inter = setInterval(getLigthInfo, 5000);
    } else {
        active_dvc = null;
        clearInterval(light_inter);
        clearChart();
    }
}

function deviceRGB(r, g, b) {
    devices[active_dvc].RGB = [r, g, b];
    console.log(devices[active_dvc].RGB);
}

function deviceMode() {
    var checkbtns = document.getElementsByClassName("modes")[0].querySelectorAll("input");
    checkbtns.forEach(btn => {
        if (btn.id != this.id) {
            btn.checked = false;
        }
    })
    if (active_dvc != null) {
        console.log(this.id);
        devices[active_dvc].mode = this.id;
    }
}

function deviceSend(id) {
    console.log(id);
    console.log(active_dvc);
    if (active_dvc != null) {
        console.log("Sending mode");
        if (id == "set") {
            console.log('sending');
            devices[active_dvc].state = true;
        } else {
            devices[active_dvc].state = false;
        }
        sendJSON("api/device/data");
    }
}

function deviceAttr() {
    var r = document.getElementById('red-slider').value;
    var g = document.getElementById('green-slider').value;
    var b = document.getElementById('blue-slider').value;
    var spd = document.getElementById('vel-slider').value;
    var len = document.getElementById('len-slider').value;
    var lon = document.getElementById('lon-slider').value;
    var loff = document.getElementById('loff-slider').value;
    deviceRGB(r, g, b);
    devices[active_dvc].speed = spd;
    devices[active_dvc].length = len;
    devices[active_dvc].light_on = lon;
    devices[active_dvc].light_off = loff;
}