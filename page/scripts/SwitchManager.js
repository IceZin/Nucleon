class SwitchManager {
    constructor(managers) {
        let switches = {};
        let updates = {};

        this.registerSwitchGroup = function(id, arr) {
            switches[id] = {
                values: [],
                elements: arr
            };

            for (let i = 0; i < arr.length; i++) {
                switches[id].values[i] = false;
                let sw = arr[i].querySelector(".sw");

                arr[i].onclick = function() {
                    switches[id].values[i] = !switches[id].values[i];

                    let state = switches[id].values[i];

                    if (state) {
                        sw.style.left = "calc(var(--size_w) - var(--size_h))";
                        sw.style.backgroundColor = "#fff";
                    } else {
                        sw.style.left = 0;
                        sw.style.backgroundColor = "#61727f";
                    }

                    if (updates[id] != null) {
                        updates[id]({
                            sw: i,
                            val: state
                        });
                    }
                }
            }
        }

        this.unregisterSwitchGroup = function(id) {
            if (switches[id] != null) {
                for (let i = 0; i < switches[id].elements.length; i++) switches[id].elements[i].onclick = null;
                switches[id] = null;
            }
        }

        this.registerUpdate = function(id, callback) {
            updates[id] = callback;
        }
    }
}

export default SwitchManager;