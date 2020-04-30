var http = require('http');
var fs = require('fs');
var net = require('net');

var portname = '192.168.0.8';
var port = '1108';
var clients = {};
var clients_conn = [];
const server = new net.Server();
var DsBot;

http.createServer((req, res) => {
    console.log(req.method);
    console.log(req.url);
    if (req.url == "/"){
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': 'http://191.182.22.15:1108 http://192.168.0.8:1108'
        });
        var htmlfile = fs.createReadStream('page.html');
        htmlfile.pipe(res);
    } else if (req.url == "/style.css") {
        res.writeHead(200, {
            'Content-Type': 'text/css'
        });
        var cssfile = fs.createReadStream('style.css');
        cssfile.pipe(res);
    } else if (req.url == "/pageControl.js") {
        res.writeHead(200, {
            'Content-Type': 'text/javascript'
        });
        var jsfile = fs.createReadStream('pageControl.js');
        jsfile.pipe(res);
    }
    if (req.method == "GET"){
        if (req.url == "/test") {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({"Name": "Teste"}));
        } else if (req.url == "/api/devices") {
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({'connected': Object.keys(clients)}));
        }
    } else if (req.method == "POST") {
        req.on('data', function(data) {
            var data = JSON.parse(data);
            console.log(data);
            if (req.url == "/api/device/data") {
                res.writeHead(200, {'Content-Type': 'text/html'});
                clients_conn[data.device].write(`<RGB=[${data.RGB[0]},${data.RGB[1]},${data.RGB[2]}]>`);
                if (data.mode) {
                    if (data.state) {
                        console.log(data.mode);
                        if (data.mode == "trail") {
                            clients_conn[data.device].write(`<speed=${data.speed}>`);
                            clients_conn[data.device].write(`<len=${data.length}>`);
                            clients_conn[data.device].write(`<${data.mode}>`);
                        } else if (data.mode == "autoctrl") {
                            clients_conn[data.device].write(`<${data.mode}=[${data.light_on},${data.light_off}]>`);
                        } else {
                            clients_conn[data.device].write(`<${data.mode}>`);
                            console.log("Sent diff command");
                        }
                    } else {
                        clients_conn[data.device].write(`<clear>`);
                    }
                }
            } else if (req.url == "/api/device/lightinfo") {
                try {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.write(JSON.stringify(clients[data.name].lightD));
                } catch (err) {
                    res.writeHead(404);
                }
            }
        });
        req.on('end', function() {
            res.end();
        });
    }
}).listen(port, portname, () => {
    console.log(`Server is running on server http://${portname}:${port}`);
});

server.listen(1107, function(){
    console.log("TCP Server running on port 1107");
    setInterval(sendKeepalive, 10000);
});

server.on('connection', function(client) {
    console.log("New connection");
    client.on('data', function(data) {
        console.log(data.toString());
        var data = JSON.parse(data.toString());
        if (data.address) {
            clients[data.address] = {
                'lightD': {},
                'lRecvd': false,
                'interval': null,
                'type': null
            }
            clients_conn.push(client); 
            if (data.type == "attacker") {
                client.write("{deauthAll}");
                client.write("{attackStart}");
            } else if (data.type == "subdevice") {
                sendLightCmd(client);
                clients[data[1]].interval = setInterval(sendLightCmd, 5000, client);
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
        }
    });
    client.on('end', function() {
        deleteClient(client);
    });
});

function sendLightCmd(client) {
    writeCommand(client, "<lightInfo>");
    let client_addr = Object.keys(clients)[clients_conn.indexOf(client)];
    if (client_addr != null) {
        if(!clients[client_addr].lRecvd) {
            console.log("Not received");
        } else {
            clients[client_addr].lRecvd = false;
        }
    }
}

function deleteClient(client) {
    let client_ind = clients_conn.indexOf(client);
    console.log(client_ind);
    if (client_ind != null) {
        try {
            clearInterval(clients[Object.keys(clients)[client_ind]].interval);
            clients_conn.splice(client_ind, 1);
            delete clients[Object.keys(clients)[client_ind]];
            console.log("Client disconnected");
        } catch (err) {
            console.log(err);
        }
    }
}

function writeCommand(client, command) {
    try {
        client.write(command);
    } catch (err) {
        console.log("Data not sent");
    }
}

function sendKeepalive(){
    clients_conn.forEach(client => {
        console.log("Sending keep alive");
        try {
            client.write("0");
        } catch (err) {
            console.log("Client not receiving keep alive packet");
        }
    })
}
