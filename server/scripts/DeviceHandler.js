class Device {
    constructor(request, socket, cookies) {
        let mode = null;
        let dvc = this;
        let awaitingPing = false;

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

        this.ping = function() {
            if (!awaitingPing) {
                try {
                    socket.write(Buffer.from([0x0]));
                } catch (error) {
                    console.log(error)
                }

                awaitingPing = true;

                setTimeout(() => {
                    if (awaitingPing) {
                        if (this.events['end'] != null) this.events['end']();
                        socket.destroy();
                    } else {
                        this.ping();
                    }
                }, 2000);
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

        this.send = function (data) {
            socket.write(data);
        }
    }

    on (event, callback) {
        this.events[event] = callback;
    }
}

module.exports = Device;