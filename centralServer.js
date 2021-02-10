var http = require('http');
var fs = require('fs');
const url = require('url');
const { setInterval } = require('timers');
const crypto = require('crypto');

const port = process.env.PORT || 8080;
var users = {
    "IceZin": {
        pass: "123",
        token: "fb501a2157d3eefc",
        dvcs: {}
    }
}

var tokens = {
    "fb501a2157d3eefc": "IceZin"
}

var info = {}

var clients = {};

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
        writePg(res, {'Content-type': 'text/html'}, './login/login.html');
    },
    '/cosmos': function(req, res) {
        let path = ''

        if (checkMobile(req.headers["user-agent"])) path = "mobile";
        else path = "main";

        writePg(res, {'Content-type': 'text/html'}, `./${path}/cosmos.html`);
    },
    '/cosmos.css': function(req, res) {
        let path = ''

        if (checkMobile(req.headers["user-agent"])) path = "mobile";
        else path = "main";

        writePg(res, {'Content-type': 'text/css'}, `./${path}/cosmos.css`);
    },
    '/cosmos.js': function(req, res) {
        writePg(res, {'Content-type': 'text/javascript'}, `./scripts/cosmos.js`);
    },
    '/mb.js': function(req, res) {
        writePg(res, {'Content-type': 'text/javascript'}, `./mobile/mb.js`);
    },
    '/login.css': function(req, res) {
        writePg(res, {'Content-type': 'text/css'}, './login/login.css');
    },
    '/login.js': function(req, res) {
        writePg(res, {'Content-type': 'text/javascript'}, './login/login.js');
    },
    '/electron_style.css': function(req, res) {
        writePg(res, {'Content-type': 'text/css'}, './electron/electron_style.css');
    },
    '/ElectonJS.js': function(req, res) {
        writePg(res, {'Content-type': 'text/javascript'}, './electron/ElectronJS.js');
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

            Object.keys(users[user].dvcs).forEach(dvcAddr => {
                dvcs.push({
                    addr: dvcAddr,
                    name: users[user].dvcs[dvcAddr].name
                })
            })

            res.end(JSON.stringify(dvcs));
        }
    },
    "/api/devices/aps": function(res, headers) {
        res.statusCode = 200;
        setHeaders(res, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({'APs': clients[req_attr.query['dvc']]['APs']}));
    }
}

function sendColor(dvc, data) {
    let opcodes, buffer;
    opcodes = Buffer.from([0x1, 0x4, 0xff])
    buffer = Buffer.concat([opcodes, Buffer.from(data.color)]);

    dvc.write(buffer);
}

function sendPhases(dvc, data) {

}

const modes = {
    0x1: sendColor,
    0x2: sendPhases,
    0x4: sendColor
}

const ppaths = {
    "/dvc/setData": function(data, headers, res) {
        let user = tokens[headers["api_token"]];
        let dvc = users[user].dvcs[data.dvc].conn;

        if (dvc) {
            let opcodes, buffer;
            let mode = data.mode.type;

            try {
                modes[mode](dvc, data);
            } catch (err) {}

            opcodes = Buffer.from([0x1, data.mode.values.length + 1, mode])
            buffer = Buffer.concat([opcodes, Buffer.from(data.mode.values)]);

            console.log(buffer);
            dvc.write(buffer);

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
            writePg(res, {'Content-type': 'image/png'}, './icons' + req_attr.pathname);
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
            }
        });
    }
});

httpserver.on('upgrade', (req, sock, head) => {
    let name = req.headers.dvc_name;
    let addr = req.headers.dvc_addr;
    let owner = req.headers.owner;

    if (tokens[owner]) {
        console.log(`[*] New connection | ${name}`);
        console.log(req.headers);
        console.log(req.url);

        users[tokens[owner]].dvcs[addr] = {
            conn: sock,
            name: name,
            mode: null
        }

        clients[addr] = {
            conn: sock
        }
        sock.write("HTTP/1.1 101 Switching Protocols\r\n")
    }

    sock.on('data', function (data) {
        console.log(data)
    });

    sock.on('end', function () {
        if (users[tokens[owner]].dvcs[addr]) delete users[tokens[owner]].dvcs[addr];
        if (clients[addr]) delete clients[addr];

        console.log(`[!] ${name} Disconnected`);
    });

    sock.on('error', function (err) {
        if (users[tokens[owner]].dvcs[addr]) delete users[tokens[owner]].dvcs[addr];
        if (clients[addr]) delete clients[addr];

        console.log(`[!] ${name} Lost connection`);
    });

    if (req.headers['upgrade'] !== 'websocket') {
        sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        return;
    }
});

httpserver.listen(port, () => {
    console.log(`Server is running on port ${port}`);

    setInterval(sendKeepalive, 60000 * 10);
});

function sendKeepalive() {
    Object.keys(clients).forEach(client => {
        try {
            clients[client].conn.write(Buffer.from([0x1]));
        } catch (err) {
            console.log(`[!] ${client} not receiving ping packets`);
        }
    });
}
