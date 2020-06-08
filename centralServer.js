var http = require('http');
var fs = require('fs');
var net = require('net');
const url = require('url');

const port = process.env.PORT || 1337;
var clients = {};
var clients_conn = [];
const server = new net.Server();

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

http.createServer((req, res) => {
    console.log(req.method);
    console.log(req.url);
    let req_attr = url.parse(req.url, true);
    console.log(req_attr.path);
    if (req_attr.pathname == "/"){
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': 'http://192.168.0.8:1108'
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
        var cssfile = fs.createReadStream('./electron_src/electron_style.css');
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
        var jsfile = fs.createReadStream('./electron_src/ElectronJS.js');
        jsfile.pipe(res);
    }
    if (req.method == "GET"){
        if (req_attr.pathname == "/test") {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({"Name": "Teste"}));
        } else if (req_attr.pathname == "/api/devices") {
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://192.168.0.8:1108'
            });
            res.end(JSON.stringify(Object.keys(clients)));
        } else if (req_attr.pathname == "/api/devices/aps") {
            console.log(req_attr.query);
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://192.168.0.8:1108'
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
            /*
            if (req.url == "/api/device/data") {
                res.writeHead(200, {'Content-Type': 'text/html'});
            } else if (req.url == "/api/device/lightinfo") {
                try {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.write(JSON.stringify(clients[data.name].lightD));
                } catch (err) {
                    res.writeHead(404);
                }
            }*/
        });
        req.on('end', function() {
            res.end();
        });
    }
}).listen(port, () => {
    console.log(`Server is running on server http://$localhost:${port}`);
});

server.listen(1107, function(){
    console.log("TCP Server running on port 1107");
    setInterval(sendKeepalive, 10000);
});

server.on('connection', function(client) {
    client.setTimeout(2000);
    console.log("New connection");
    client.on('data', function(raw) {
        //console.log(raw.toString());
        var data = JSON.parse(raw.toString());
        console.log(data);
        if (data.address) {
            if (data.type == "subdevice") {
                clients[data.address.split(' ').join('_')] = {
                    'conn': client,
                    'lightD': {},
                    'lRecvd': false,
                    'interval': null,
                    'type': null,
                    'params': {},
                    'APs': []
                }
                /*sendLightCmd(data.address);
                clients.subdevice[data.address].interval = setInterval(sendLightCmd, 5000, data.address);*/
            }
        } else if (data.command) {
            if (data.command == "light") {
                let date = new Date();
                let client_addr = Object.keys(clients)[clients_conn.indexOf(client)];

                if (!clients[client_addr].lRecvd) {

                    clients[client_addr].lightD[`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`] = data.value;

                    if (Object.keys(clients[client_addr].lightD).length > 10) {
                        delete clients[client_addr].lightD[Object.keys(clients[client_addr].lightD)[0]];
                    }

                    console.log(clients[client_addr].lightD);
                }

                clients[client_addr].lRecvd = true;
            }
        } else if (data.AP) {
            clients['attacker']['AttackerESP'].APs.push(data.AP);
            console.log(clients['attacker']['AttackerESP'].APs);
        }
    });
    client.on('error', function(err) {
        console.log(err);
        console.log("[*] CLient Error");
        deleteClient(client);
    })
    client.on('end', function() {
        deleteClient(client);
    });
});

function sendLightCmd(client) {
    writeCommand(clients.subdevice[client].conn, "<lightInfo>");
    if(!clients.subdevice[client].lRecvd) {
        console.log("Not received");
    } else {
        clients.subdevice[client].lRecvd = false;
    }
}

function deleteClient(client) {
    Object.keys(clients).forEach(function(dvc) {
        if (clients[dvc].conn == client) {
            console.log(`[*] Client disconnected: ${dvc}`);
            clearInterval(clients[dvc].interval)
            delete clients[dvc];
            return;
        }
    })
}

function writeCommand(client, command) {
    try {
        client.write(command);
    } catch (err) {
        console.log("Data not sent");
    }
}

function sendKeepalive(){
    Object.keys(clients).forEach(client => {
        console.log("Sending keep alive");
        try {
            clients[client].conn.write("0");
        } catch (err) {
            console.log("Client not receiving keep alive packet");
        }
    })
}
