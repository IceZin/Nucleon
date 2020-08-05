var http = require('http');
var fs = require('fs');
const WebSocket = require('ws');
const url = require('url');
const { setInterval } = require('timers');

const port = process.env.PORT || 80;
var clients = {};

const dvcs_commands = {
    "/api/device/data": function(data) {
        console.log(data);

        let dvc_addr = Object.keys(data)[0];
        let dvc = clients[dvc_addr].conn;
        let dvc_data = data[dvc_addr];

        Object.keys(dvc_data.params).forEach(key => {
            if (JSON.stringify(dvc_data.params[key]) == JSON.stringify(clients[dvc_addr].params[key])) return;

            console.log("NotT");
            dvc.send(JSON.stringify({[key]: dvc_data.params[key]}));
        });

        clients[dvc_addr].params = dvc_data.params;
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
    let req_attr = url.parse(req.url, true);

    if (req_attr.pathname == "/"){
        res.writeHead(200, {
            'Content-Type': 'text/html'
        });

        var htmlfile = fs.createReadStream('page.html');
        htmlfile.pipe(res);
    } else if (req_attr.pathname == "/style.css") {
        res.writeHead(200, {
            'Content-Type': 'text/css'
        });

        var cssfile = fs.createReadStream('style.css');
        cssfile.pipe(res);
    } else if (req_attr.pathname == "/electron_style.css") {
        res.writeHead(200, {
            'Content-Type': 'text/css'
        });

        var cssfile = fs.createReadStream('electron_style.css');
        cssfile.pipe(res);
    } else if (req_attr.pathname == "/pageControl.js") {
        res.writeHead(200, {
            'Content-Type': 'text/javascript'
        });

        var jsfile = fs.createReadStream('pageControl.js');
        jsfile.pipe(res);
    } else if (req_attr.pathname == "/ElectronJS.js") {
        res.writeHead(200, {
            'Content-Type': 'text/javascript'
        });

        var jsfile = fs.createReadStream('ElectronJS.js');
        jsfile.pipe(res);
    } else if (req_attr.pathname == "/robots933456.txt") {
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'user-agent': '*',
            'Allow': '/'
        });
        res.end();
    }

    if (req.method == "GET"){
        if (req_attr.pathname == "/api/devices") {
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify(Object.keys(clients)));
        } else if (req_attr.pathname == "/api/devices/aps") {
            console.log(req_attr.query);
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({'APs': clients[req_attr.query['dvc']]['APs']}));
        }
    } else if (req.method == "POST") {
        req.on('data', function(data) {
            var data = JSON.parse(data);
            console.log(req.url);

            try {
                dvcs_commands[req.url](data);
            } catch (err) {
                console.log(err);
                console.log('Path not found');
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

httpserver.listen(port, () => {
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
