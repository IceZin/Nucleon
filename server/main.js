var http = require('https');
var fs = require('fs');
const url = require('url');
const { setInterval } = require('timers');
const crypto = require('crypto');
const User = require('./scripts/UsersHandler.js');
const Device = require('./scripts/DeviceHandler.js');

const port = process.env.PORT || 8080;
var users = {
    "IceZin": {
        pass: "123",
        token: "fb501a2157d3eefc",
        dvcs: {}
    }
}

var info = {}

var tokens = {
    "fb501a2157d3eefc": new User("IceZin", "123", "fb501a2157d3eefc")
}

class UManager {
    constructor() {
        let genKeys = () => {
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 512,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem',
                    cipher: 'aes-256-cbc',
                    passphrase: 'top secret'
                }
            });

            console.log("[!] New key generated");
            console.log("[Public] ");

            info.publicKey = "";

            publicKey.split('\n').forEach(function(el, index) {
                if (index != 0 && index < publicKey.split('\n').length - 2) {
                    info.publicKey += el;
                }
            })

            console.log(info.publicKey);

            console.log("[Private] ");

            info.privateKey = "";

            privateKey.split('\n').forEach(function(el, index) {
                if (index != 0 && index < privateKey.split('\n').length - 2) {
                    info.privateKey += el;
                }
            })

            console.log(info.privateKey);
        }

        this.loadKeys = () => {
            genKeys();
        }
    }
}

const manager = new UManager();
manager.loadKeys();
setInterval(() => {
    manager.loadKeys();
}, 60000 * 10);

function writePg(res, headers, path) {
    try {
        var stream = fs.createReadStream(path);
    } catch (err) {
        console.log("[!] Can't find page path");

        res.statusCode = 404;
        res.end();

        return;
    }

    res.statusCode = 200;

    Object.keys(headers).forEach(key => {
        res.setHeader(key, headers[key]);
    });

    stream.pipe(res);
}

function setHeaders(res, headers) {
    Object.keys(headers).forEach(key => {
        res.setHeader(key, headers[key]);
    });
}

function checkMobile(agent) {
    console.log(agent);

    const mobiles = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];

    return mobiles.some(mobile => {
        return agent.match(mobile)
    })
}

const pgpaths = {
    '/': function(req, res) {
        writePg(res, {'Content-type': 'text/html'}, 'page/login/login.html');
    },
    '/cosmos': function(req, res) {
        let path = '';

        if (checkMobile(req.headers["user-agent"])) path = "mobile";
        else path = "main";

        writePg(res, {'Content-type': 'text/html'}, `page/main/cosmos.html`);
    },
    '/cosmos.css': function(req, res) {
        let path = ''

        if (checkMobile(req.headers["user-agent"])) path = "mobile";
        else path = "main";

        writePg(res, {'Content-type': 'text/css'}, `page/main/cosmos.css`);
    },
    '/login.css': function(req, res) {
        writePg(res, {'Content-type': 'text/css'}, 'page/login/login.css');
    },
    '/electron_style.css': function(req, res) {
        writePg(res, {'Content-type': 'text/css'}, 'electron/electron_style.css');
    },
    '/ElectonJS.js': function(req, res) {
        writePg(res, {'Content-type': 'text/javascript'}, 'electron/ElectronJS.js');
    },
    '/robots933456.txt': function(req, res) {
        let headers = {
            'Content-Type': 'text/plain',
            'user-agent': '*',
            'Allow': '/'
        }

        res.statusCode = 200;
        setHeaders(res, headers);
        res.end();
    }
}

const gpaths = {
    "/check": function(res, headers) {
        if (tokens[headers["api_token"]] != null) {
            res.statusCode = 200;
            res.end();
        } else {
            res.statusCode = 404;
            res.end();
        }
    },
    "/dvc/getDvcs": function(res, headers) {
        let user = tokens[headers['api_token']];

        if (user) {
            res.statusCode = 200;
            setHeaders(res, {'Content-Type': 'application/json'});

            let dvcs = []

            Object.values(user.getDevices()).forEach(dvc => {
                dvcs.push({
                    addr: dvc.addr,
                    name: dvc.name
                })

                console.log(dvcs);
            })

            res.end(JSON.stringify(dvcs));
        }
    }
}

function sendColor(dvc, data) {
    let opcodes, buffer;
    opcodes = Buffer.from([0x1, 0x4, 0xff])
    buffer = Buffer.concat([opcodes, Buffer.from(data.color)]);

    dvc.send(buffer);
}

function sendPhases(dvc, data) {
    let opcodes, buffer;
    opcodes = Buffer.from([0x1, 0x4, 0xff])
}

const modes = {
    0x1: sendColor,
    0x2: sendPhases,
    0x4: sendColor
}

const ppaths = {
    "/dvc/setData": function(data, headers, res) {
        let user = tokens[headers["api_token"]];
        let dvc = user.getDevice(data.dvc);

        if (dvc) {
            user.setActiveDevice(data.dvc);

            let opcodes, buffer;
            let mode = data.mode.type;

            try {
                modes[mode](dvc, data);
            } catch (err) {}

            opcodes = Buffer.from([0x1, data.mode.values.length + 1, mode])
            buffer = Buffer.concat([opcodes, Buffer.from(data.mode.values)]);

            console.log(buffer);
            dvc.send(buffer);

            console.log(`[*] Sending data to device ` + data.dvc);
        }
    },
    "/lgn": function(data, headers, res) {
        console.log(data.user);
        console.log(data.passwd);

        if (users[data.user].pass == data.passwd) {
            res.statusCode = 200;

            setHeaders(res, {
                'Content-Type': 'application/json',
                'api_token': users[data.user].token
            });

            res.end();

            return;
        }

        res.statusCode = 404;
        res.end();
    }
}

var httpserver = http.createServer((req, res) => {
    let req_attr = url.parse(req.url, true);

    console.log("[*] New Request");
    console.log(req_attr.pathname);

    if (req.method == "GET") {
        if (req_attr.pathname.includes(".png")) {
            writePg(res, {'Content-type': 'image/png'}, 'page/icons' + req_attr.pathname);
        } else if (req_attr.pathname.includes(".js")) {
            writePg(res, {'Content-type': 'text/javascript'}, 'page/scripts' + req_attr.pathname);
        } else {
            if (pgpaths[req_attr.pathname] != undefined) {
                pgpaths[req_attr.pathname](req, res);
            } else if (gpaths[req_attr.pathname] != undefined) {
                gpaths[req_attr.pathname](res, req.headers);
            }
        }
    } else if (req.method == "POST") {
        req.on('data', function(data) {
            try {
                var data = JSON.parse(data);
                ppaths[req_attr.pathname](data, req.headers, res);
            } catch (err) {
                console.log("[!] POST path not found");
                console.log(err);
            }
        });
    }
});

function getCookies(raw) {
    var cookies = raw.split(';')
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

const upgradeHandlers = {
    "GrWebClient": function(req, sock, head, cookies) {
        let token = cookies.api_token;
        let user = tokens[token];
        let key = req.headers["sec-websocket-key"];

        if (user) {
            let headers = [
                "HTTP/1.1 101 Switching Protocols",
                "Upgrade: websocket",
                "Connection: Upgrade",
                "Sec-WebSocket-Protocol: GrWebClient",
                `Sec-WebSocket-Accept: ${crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')}`
            ]

            sock.write(headers.concat('\r\n').join('\r\n'))

            sock.on('data', function(data) {
                console.log(data);
            });
        }
    },
    "Device": function(req, sock, head, cookies) {
        let owner = cookies.owner;
        let user = tokens[owner];

        if (user) {
            let device = new Device(req, sock, cookies);

            let headers = [
                "HTTP/1.1 101 Switching Protocols",
                "Upgrade: websocket",
                "Connection: Upgrade",
                "Sec-WebSocket-Protocol: Device"
            ]

            user.registerDevice(device.addr, device);

            sock.write(headers.concat('\r\n').join('\r\n'));

            device.on('data', function (data) {
                if (data[0] == 0) return;
                console.log("[*] New data from " + device.addr)
                console.log(data)
            });

            device.on('error', function () {
                user.unregisterDevice(device.addr);
            })

            device.on('end', function () {
                user.unregisterDevice(device.addr);
            })
        }
    }
}

httpserver.on('upgrade', (req, sock, head) => {
    if (req.headers['upgrade'] !== 'websocket') {
        sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        return;
    }

    console.log("[*] New UPGRADE request " + req.headers["sec-websocket-protocol"]);

    let cookies = getCookies(req.headers.cookie);
    console.log(cookies);

    upgradeHandlers[req.headers["sec-websocket-protocol"]](req, sock, head, cookies);
});

httpserver.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
