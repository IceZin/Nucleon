const xml = new XMLHttpRequest();
const ip = "https://nucleon.azurewebsites.net";
//const ip = "http://localhost:8080";

function gbi(id) {
    return document.getElementById(id);
}

function p(mt, dt, ) {

}

class Particle {
    constructor(x, y, sz, clr) {
        let ctx = document.getElementById('bg').getContext('2d');

        this.a_sz = sz;
        this.x = x;
        this.y = y;
        this.state = true;

        this.draw = () => {
            ctx.beginPath();
            ctx.arc(x, y, this.a_sz, 0, Math.PI * 2, false);
            ctx.fillStyle = "#32ca43";
            ctx.shadowColor = "#32ca43";
            ctx.shadowBlur = 10;
            ctx.fill();

            ctx.shadowBlur = 0;
        }

        this.update = (i) => {
            this.a_sz = sz * i;

            this.draw();
        }
    }
}

function connectParticles(particle, particles) {
    let ctx = document.getElementById('bg').getContext('2d');

    for (let i = 0; i < particles.length; i++) {
        let distance = Math.sqrt((particle.x - particles[i].x) ** 2 + (particle.y - particles[i].y) ** 2)

        if (distance <= 140) {
            ctx.strokeStyle = "#289E35";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particles[i].x, particles[i].y)
            ctx.stroke()
        }
    }
}

function updateParticles(particles, hue) {
    let canvas = document.getElementById('bg');
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
        connectParticles(particles[i], particles)
    }

    for (let i = 0; i < particles.length; i++) {
        let pos = Math.abs(hue - i);

        if (pos > 0 && pos < particles.length) {
            let intensity = pos / particles.length;
            intensity = (intensity - 1) / -1;

            if (intensity >= 0) {
                particles[i].update(intensity);
            } else {
                particles[i].update(0);
            }
        } else if (pos >= particles.length) {
            let intensity = (pos - particles.length) / particles.length;

            if (intensity >= 0) {
                particles[i].update(intensity);
            } else {
                particles[i].update(0);
            }
        } else if (pos == 0) {
            particles[i].update(1);
        }
    }
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

    xml.onreadystatechange = function(){
        if(this.readyState == 4) {
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
    while (cookie.charAt(0) == ' ') {
        cookie = cookie.substring(1);
    }

    let ck = cookie.substring(0, cookie.indexOf('='));
    let ck_val = cookie.substring(cookie.indexOf('=') + 1, cookie.length);

    arr[ck] = ck_val;
});

if (arr['api_token']) {
    req({
        method: "GET",
        url: "check",
        headers: {
            'Content-Type': 'text/plain',
            'api_token': arr['api_token']
        }
    }, function (resText, status, headers) {
        if (status == 200) {
            window.location.pathname = "/cosmos";
        }
    })
}

window.onload = function() {
    let canvas = document.getElementById('bg');

    canvas.getContext('2d').canvas.width = window.innerWidth;
    canvas.getContext('2d').canvas.height = window.innerHeight - 100;

    let max_w = parseInt(canvas.width);
    let max_h = parseInt(canvas.height);

    let particles = [];

    let last_val = 0;
    let qtd = Math.round((max_w * max_h) / 7500);

    for (let i = 0; i < qtd; i++) {
        let sz = Math.floor(Math.random() * ((max_w / 90) - 3) + 3);
        let particle_mxw = (max_w / qtd) * (i + 1)

        particles[i] = new Particle(Math.random() * (particle_mxw - last_val) + last_val, Math.random() * (max_h - sz) + sz, sz, "#f00")
        last_val = particle_mxw;
    }

    let hue = 0;

    updateParticles(particles, hue)

    setInterval(function() {
        updateParticles(particles, hue)
        hue++;
        if (hue == 2 * particles.length) hue = 0;
    }, 1000 / 120)

    document.getElementById("login").onclick = function() {
        let usrnm = document.getElementById('username').value;
        let pss = document.getElementById('password').value;

        sendJSON("lgn", {
            user: usrnm,
            passwd: pss
        }, function(data, status, headers) {
            if (status == 200) {
                document.cookie = `api_token=${headers["api_token"]};`;
                window.location.pathname = "/cosmos";
            }
        });
    }

    document.getElementById("register").onclick = function() {
        console.log("Registering")
    }
}