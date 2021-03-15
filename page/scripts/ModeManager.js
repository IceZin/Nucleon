import DropDownManager from "./DropDownManager.js"
import CheckManager from "./CheckManager.js"

function gbi(id) {
    return document.getElementById(id);
}

const boxTypes = {
    'sw': function(info) {
        let box = `<div class="sw_box" id="mbox">
                <header>
                    <h1>${info.name}</h1>
                    <div class="sw_btn">
                        <span class="sw"></span>
                    </div>
                </header>
                <div class="graph_box" id="${info.id}">

                </div>
            </div>`

        return box;
    },
    'opt': function(info) {
        let box = `<div class="opt-box" id="mbox">
            <header>
                <h1>${info.name}</h1>
            </header>`

        info.opts.forEach(opt => {
            box += `<div class="opt-el">
                <div class="opt-chk"></div>
                <div class="box-cnt">
                    <h1>${opt}</h1>
                </div>
            </div>`
        })

        box += "</div>";

        return box;
    }
}

class ModeManager {
    constructor(managers) {
        var modedp = new DropDownManager('modedp');
        var box = gbi('mode-opts');
        var mbox = document.querySelector(".mopt-box");
        var activeMode = 0;

        var mode_opts = [];

        let createElement = (info) => {
            let el = `<div id="m-info" class="el1">
                <div>
                    <h1>${info.title}</h1>
                    <h1>${info.value}</h1>
                </div>
                <input type="range" min="${info.min}" max="${info.max}" value="0"></input>
            </div>`

            box.insertAdjacentHTML('beforeend', el);
        }

        let disableElement = (elements) => {
            let sliders = box.querySelectorAll('#m-info');

            elements.forEach(element => {
                sliders[element].querySelector('input').style.background = "#000";
                sliders[element].querySelector('input').disabled = true;
            })
        }

        let enableElement = (elements) => {
            let sliders = box.querySelectorAll('#m-info');

            elements.forEach(element => {
                let slider = sliders[element].querySelector("input");
                let len = (100 * slider.value) / slider.max;

                slider.style.background = `linear-gradient(90deg, rgb(201, 238, 242) ${len}%, rgb(197, 197, 197) ${len}%)`
                slider.disabled = false;
            })
        }

        let createBox = (info) => {
            if (boxTypes[info.type] == null) return;

            let box = boxTypes[info.type](info);

            mbox.insertAdjacentHTML('beforeend', box)

            let boxes = mbox.querySelectorAll("#mbox");
            return boxes[boxes.length - 1];
        }

        let clearBoxes = () => {
            mbox.querySelectorAll("div").forEach(box => {
                box.remove();
            })
        }

        const modes = [
            "Clear",
            "Static",
            "Shift to Left",
            "Shift to Right",
            "Spectrum"
        ]

        const setElements = [
            [],
            [
                {
                    title: "Intensity",
                    value: "0",
                    min: 0,
                    max: 100
                }
            ],
            [
                {
                    title: "Intensity",
                    value: "0",
                    min: 0,
                    max: 100
                },
                {
                    title: "Speed",
                    value: "0",
                    min: 0,
                    max: 100
                }
            ],
            [
                {
                    title: "Intensity",
                    value: "0",
                    min: 0,
                    max: 100
                },
                {
                    title: "Speed",
                    value: "0",
                    min: 0,
                    max: 100
                }
            ],
            [
                {
                    title: "Intensity",
                    value: "0",
                    min: 0,
                    max: 100
                },
                {
                    title: "Brightness Decay",
                    value: "1",
                    min: 1,
                    max: 255
                },
                {
                    title: "Sound Cutoff",
                    value: "0",
                    min: 0,
                    max: 1023
                },
                {
                    title: "Max Sound Intensity",
                    value: "0",
                    min: 0,
                    max: 1023
                }
            ]
        ]

        const modeOptions = {
            4: function() {
                mode_opts = [];

                let animTypes = createBox({type: 'opt', name: "Spectrum Animation", opts: ["Solid", "Linear"]});
                console.log(animTypes);

                createBox({type: 'sw', name: "Auto Mode", id: "mx_val"});

                let chkManager = new CheckManager(animTypes.querySelectorAll('.opt-el'), animTypes.querySelectorAll('.opt-chk'), true);
                chkManager.registerUpdate(function(i) {
                    mode_opts[0] = i;

                    managers.dvcmanager.updateMode();
                })

                managers.swmanager.registerUpdate("md_switches", function (data) {
                    if (data.val) {
                        disableElement([3]);
                    } else {
                        enableElement([3]);
                    }

                    managers.dvcmanager.updateMode();
                })
                
                managers.graph_mng.registerChart({
                    parent: box.querySelector('.graph_box'),
                    chart_id: 'mx_val',
                    title: 'Max Sound Intensity'
                })
            }
        }

        const graphsID = {
            4: ["mx_val"]
        }

        modedp.createElements(modes);

        modedp.registerUpdate((data) => {
            console.log("[*] Mode selected " + data)

            if (graphsID[activeMode]) {
                graphsID[activeMode].forEach(graphID => {
                    managers.graph_mng.unregisterChart(graphID);
                })
            }

            box.innerHTML = "";
            activeMode = data;
            setElements[data].forEach(el => {
                createElement(el)
            })

            try {
                managers.swmanager.unregisterSwitchGroup("md_switches");
                clearBoxes();
                modeOptions[data]();

                let switches = mbox.querySelectorAll(".sw_btn");
                managers.swmanager.registerSwitchGroup("md_switches", switches);
            } catch (error) {
                console.log(error)
            }

            document.getElementsByClassName("el1")
            document.querySelectorAll('[id="m-info"]').forEach(el => {
                let title = el.getElementsByTagName('h1')[1];
                let slider = el.getElementsByTagName('input')[0];

                slider.oninput = function() {
                    let len = (100 * slider.value) / slider.max;
                    slider.style.background = `linear-gradient(90deg, rgb(201, 238, 242) ${len}%, rgb(197, 197, 197) ${len}%)`

                    title.innerHTML = slider.value;

                    managers.dvcmanager.updateMode();
                }
            })

            managers.dvcmanager.updateMode();
        })

        this.getData = function () {
            let data = {
                type: activeMode,
                values: []
            }

            box.querySelectorAll('input').forEach(function (slider, index) {
                let value = parseInt(slider.value);

                if (slider.disabled) {
                    value = 0;
                }

                if (setElements[activeMode][index].max == 1023) {
                    for (let i = 0; i < 5; i++) {
                        if (value >= 255) {
                            data.values.push(255);
                            value -= 255;
                        } else if (value > 0 && value < 255) {
                            data.values.push(value);
                            value = 0;
                        } else {
                            data.values.push(0);
                        }
                    }
                } else {
                    data.values.push(value);
                }
            });

            data.values = data.values.concat(Array.from(mode_opts));

            return data;
        }
    }
}

export default ModeManager;