const ip = location.host;

class GraphManager {
    constructor() {
        const socket = new WebSocket(`wss://${ip}`, "GrWebClient");

        var charts = {};

        socket.onmessage = function(msg) {
            if (msg[0] == 0) socket.send(Buffer.from([0x0]))

            /*try {
                msg = JSON.parse(msg);

                charts[msg.chart].dps.push(msg.val);

                if (charts[msg.chart].dps.length > 10) {
                    charts[msg.chart].dps.shift();
                }

                charts[msg.chart].chart.render();
            } catch (error) {
                
            }*/
        }

        this.registerChart = function(info) {
            if (charts[info.id] == null) {
                charts[info.id] = {dps: []}

                charts[info.id].chart = new CanvasJS.Chart(info.id, {
                    theme: "dark2",
                    title: {
                        text: info.title
                    },
                    data: [{
                        type: "line",
                        dataPoints: charts[info.id].dps
                    }]
                });

                console.log(charts)

                charts[info.id].chart.render();

                socket.send(`reg_${info.id}`)
            }
        }

        this.unregisterChart = function(id) {
            if (charts[id] != null) {
                charts[id].chart.destroy();
                charts[id] = null;

                socket.send(`unreg_${id}`)
            }
        }

        socket.addEventListener('open', function(event) {
            console.log("Started websocket");
        });
    }
}

export default GraphManager;