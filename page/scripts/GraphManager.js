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
            //var ctx = document.getElementById(info.chart_id).getContext('2d');
            /*var myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        data: [12, 19, 3, 5, 2, 3],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            });*/
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