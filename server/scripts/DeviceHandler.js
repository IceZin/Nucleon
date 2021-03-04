class Device {
    constructor(request, socket, cookies) {
        let mode = null;
        let dvc = this;
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
            try {
                socket.write(Buffer.from([0x0]));
            } catch (error) {}
        }

        //this.ping_interval = setInterval(this.ping, 1000);

        this.dataHandler = {
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

        let onEnd = function() {
            clearInterval(dvc.ping_interval);

            if (dvc.events['end'] != null) dvc.events['end']();

            console.log(`[!] ${dvc.name} Disconnected`);
        }

        socket.on('end', function() {
            onEnd();
        });

        let onError = function () {
            clearInterval(dvc.ping_interval);

            if (dvc.events['error'] != null) dvc.events['error']();

            console.log(`[!] ${dvc.name} Lost connection`);
        }

        socket.on('error', function () {
            onError();
        });

        this.send = function (data) {
            socket.write(data);
        }
    }

    on (event, callback) {
        this.events[event] = callback;
    }
}

module.exports = Device;