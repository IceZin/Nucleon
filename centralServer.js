var http = require('http');
var fs = require('fs');
const url = require('url');

const port = process.env.PORT || 1337;
var clients = {};

const dvcs_commands = {
    "/api/device/data": function(data) {
        console.log(data);
        let dvc_addr = Object.keys(data)[0];
        let dvc = clients[dvc_addr].conn;
        let dvc_data = data[dvc_addr];
        Object.keys(dvc_data.params).forEach(key => {
            //if (dvc_data.params[key] == clients[dvc_addr].params[key]) return;
            dvc.write(JSON.stringify({[key]: dvc_data.params[key]}));
        })
        clients[dvc_addr].params = dvc_data.params;
    }
}

var httpserver = http.createServer((req, res) => {
    console.log(req.method);
    console.log(req.url);
    let req_attr = url.parse(req.url, true);
    console.log(req_attr.path);

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
        if (req_attr.pathname == "/test") {
            res.setHeader('Content-Type', 'application/json');       
            res.end(JSON.stringify({"Name": "Teste"}));
        } else if (req_attr.pathname == "/api/devices") {
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
    console.log(req);

    if (req.headers['upgrade'] !== 'WebSocket' && req.headers['origin'] !== null) {
        sock.end('HTTP/1.1 400 Bad Request');
        return;
    }

    sock.write('HTTP/1.1 101 Switching protocols');
    console.log(`[*] New Connection | ${req.headers['origin']}`);

    sock.setEncoding("utf8");

    sock.on('data', function(data) {
        console.log(data);
    });

    sock.on('end', function() {
        deleteClient(sock);
    });

    clients[req.headers['origin'].split(' ').join('_')] = {
        'conn': sock,
        'lightD': {},
        'lRecvd': false,
        'interval': null,
        'type': null,
        'params': {},
        'APs': []
    };
});

httpserver.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

function deleteClient(client) {
    Object.keys(clients).forEach(function(dvc) {
        if (clients[dvc].conn == client) {
            console.log(`[*] Client disconnected: ${dvc}`);

            clearInterval(clients[dvc].interval)
            delete clients[dvc];

            return;
        }
    });
}

function sendKeepalive(){
    Object.keys(clients).forEach(client => {
        console.log("Sending keep alive");

        try {
            clients[client].conn.write('0');
        } catch (err) {
            console.log("Client not receiving keep alive packet");
        }
    });
}
