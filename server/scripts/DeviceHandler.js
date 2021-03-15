class Device {
    constructor(request, socket, cookies) {
        let mode = null;
        let dvc = this;
        let awaitingPing = false;
        let packetLoss = 0;
        let timeoutInterval;
        let pingTimeout;

        this.dvc_data = {
            snd_peak: 0
        };
        this.events = {}

        this.name = cookies.dvc_name;
        this.addr = cookies.dvc_addr;
        this.owner = cookies.owner;

        console.log(`[*] New device | ${this.name}`);
        console.log(request.headers);
        console.log(request.url);

        this.clearTimeouts = function() {
            if (timeoutInterval) clearTimeout(timeoutInterval);
            if (pingTimeout) clearTimeout(pingTimeout);
        }

        this.ping = function() {
            if (!awaitingPing) {
                try {
                    socket.write(Buffer.from([0x0]));
                } catch (error) {
                    console.log(error)
                }

                awaitingPing = true;

                pingTimeout = setTimeout(() => {
                    if (awaitingPing) {
                        if (timeoutInterval != null) {
                            timeoutInterval = setTimeout(() => {
                                packetLoss = 0;
                            }, 5000);
                        }

                        packetLoss++;
                        awaitingPing = false;

                        if (packetLoss >= 5) {
                            if (this.events['end'] != null) this.events['end']();
                            socket.destroy();
                        } else {
                            this.ping();
                        }
                    } else {
                        this.ping();
                    }
                }, 1000);
            }
        }

        setTimeout(() => {
            this.ping();
        }, 2000);

        this.dataHandler = {
            0: function(data) {
                awaitingPing = false;
            },
            1: function(data) {
                let d_type = data[1];

                if (d_type == 0) {
                    dvc.dvc_data.snd_peak = 0;
                    for (let i = 0; i < 5; i++) dvc.dvc_data.snd_peak += data[i + 2];
                }
            }
        }

        let onData = function(data) {
            if (dvc.events['data'] != null) dvc.events['data'](data);
            if (dvc.dataHandler[data[0]] != null) dvc.dataHandler[data[0]](data);
        }

        socket.on('data', function (data) {
            onData(data);
        })

        socket.on('error', function (err) {
        })

        this.send = function (data) {
            socket.write(data);
        }
    }

    on (event, callback) {
        this.events[event] = callback;
    }
}

module.exports = Device;