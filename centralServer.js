var http = require('https');
var fs = require('fs');
const WebSocket = require('ws');
const url = require('url');
const { setInterval } = require('timers');
const crypto = require('crypto');

const port = process.env.PORT || 443;
var users = {
    "IceZin": "Batatinha123"
}

var info = {}

var clients = {};

class UManager {
    constructor() {
        let keys;

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
            fs.readFile('./data/keys.json', (err, data) => {
                if (err) {
                    genKeys();
                    return;
                };

                try {
                    keys = JSON.parse(data);
                    if (keys.privateKey == null || keys.publicKey == null) genKeys();
                } catch (perr) {
                    genKeys();
                }
            });
        }
    }
}

const manager = new UManager();
manager.loadKeys();

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
        console.log(key)
        console.log(headers[key])
        res.setHeader(key, headers[key]);
    });
}

const pgpaths = {
    '/': function(res) {
        writePg(res, {'Content-type': 'text/html'}, 'login/login.html');
    },
    '/cosmos': function(res) {
        writePg(res, {'Content-type': 'text/html'}, 'main/cosmos.html');
    },
    '/cosmos.css': function(res) {
        writePg(res, {'Content-type': 'text/css'}, 'main/cosmos.css');
    },
    '/cosmos.js': function(res) {
        writePg(res, {'Content-type': 'text/javascript'}, 'main/cosmos.js');
    },
    '/login.css': function(res) {
        writePg(res, {'Content-type': 'text/css'}, 'login/login.css');
    },
    '/login.js': function(res) {
        writePg(res, {'Content-type': 'text/javascript'}, 'login/login.js');
    },
    '/electron_style.css': function(res) {
        writePg(res, {'Content-type': 'text/css'}, 'electron/electron_style.css');
    },
    '/ElectonJS.js': function(res) {
        writePg(res, {'Content-type': 'text/javascript'}, 'electron/ElectronJS.js');
    },
    '/robots933456.txt': function(res) {
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
    "/api/devices": function(res) {
        res.statusCode = 200;
        setHeaders(res, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(Object.keys(clients)));
    },
    "/api/devices/aps": function(res) {
        res.statusCode = 200;
        setHeaders(res, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({'APs': clients[req_attr.query['dvc']]['APs']}));
    }
}

const ppaths = {
    "/api/device/data": function(data, res) {
        console.log(data);

        let dvc_addr = Object.keys(data)[0];
        let dvc = clients[dvc_addr].conn;
        let dvc_data = data[dvc_addr];

        Object.keys(dvc_data.params).forEach(key => {
            if (JSON.stringify(dvc_data.params[key]) == JSON.stringify(clients[dvc_addr].params[key])) return;

            console.log("[*] Sending " + JSON.stringify(dvc_data.params[key]));
            dvc.send(JSON.stringify({[key]: dvc_data.params[key]}));
        });

        clients[dvc_addr].params = dvc_data.params;
    },
    "/lgn": function(data, res) {
        console.log(data.user);
        console.log(data.passwd);

        if (users[data.user] == data.passwd) {
            res.statusCode = 200;

            setHeaders(res, {
                'Content-Type': 'application/json',
                'API_Token': info.publicKey
            });

            res.end();
        }

        res.statusCode = 404;
        res.end();
    }
}

const wssServer = new WebSocket.Server({noServer: true});

wssServer.on('connection', function connection(ws, name) {
    console.log(`[*] New connection | ${name}`);

    ws.on('message', msg => {
        console.log(`Messagem from ${name}\n${msg}\n`);
    });

    ws.on('close', function() {
        delete clients[name];
        console.log(`[*] Client disconnected | ${name}`);
    });

    ws.on('pong', function() {
       ws.isAlive = true; 
       console.log("pong from " + name);
    });

    clients[name] = {
        'conn': ws,
        'lightD': {},
        'lRecvd': false,
        'interval': null,
        'type': null,
        'params': {},
        'APs': []
    };
});

var httpserver = http.createServer((req, res) => {
    console.log("New request")

    res.hea

    let req_attr = url.parse(req.url, true);

    console.log("PATH: " + req_attr.path);

    if (req.method == "GET"){
        if (pgpaths[req_attr.pathname] != undefined) {
            pgpaths[req_attr.pathname](res);
            res.statusCode = 200;
            res.end();
        } else if (gpaths[req_attr.pathname] != undefined) {
            gpaths[req_attr.pathname](res);
        }
    } else if (req.method == "POST") {
        req.on('data', function(data) {
            try {
                var data = JSON.parse(data);
                ppaths[req_attr.pathname](data, res);
            } catch (err) {
                console.log("[!] POST path not found");
            }
        });

        req.on('end', function() {
            res.end();
        });
    }
});

httpserver.on('upgrade', (req, sock, head) => {
    console.log(req.headers);
    console.log(req.url);

    if (req.headers['upgrade'] !== 'websocket') {
        sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        return;
    }

    wssServer.handleUpgrade(req, sock, head, function done(ws) {
        wssServer.emit('connection', ws, url.parse(req.url, true).query['dvc'].split(' ').join('_'));
    });
});

httpserver.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
    setInterval(sendKeepalive, 300000);
});

function sendKeepalive() {
    Object.keys(clients).forEach(client => {
        try {
            clients[client].conn.ping();
        } catch (err) {
            console.log("Client not receiving keep alive packet");
        }
    });
}
