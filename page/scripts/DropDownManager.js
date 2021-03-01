function gbi(id) {
    return document.getElementById(id);
}

class DropDownManager {
    constructor(dpid) {
        let dpel = gbi(dpid);
        let callbacks = {
            update: []
        }

        let btn = dpel.querySelectorAll('div')[0];
        let dp = dpel.querySelectorAll('div')[1];

        let state = false;
        let activeItem = null;
        
        this.createElements = function (modes) {
            modes.forEach(mode => {
                let el = `<span>${mode}</span>`;
                dp.insertAdjacentHTML('beforeend', el);
            })

            let items = dp.querySelectorAll('span');

            items.forEach(function(item, index) {
                item.onclick = function() {
                    if (item != activeItem) {
                        if (activeItem != null) activeItem.style.backgroundColor = null;

                        activeItem = item;

                        btn.querySelector('span').innerHTML = item.innerHTML;
                        item.style.backgroundColor = "#6896A0";

                        callbacks.update.forEach(cb => {
                            cb(index);
                        });
                    }
                }
            });
        }

        let setBorderRound = function() {
            btn.style.borderRadius = "5px 5px 5px 5px";
            dp.removeEventListener('transitionend', setBorderRound, false);
        }

        btn.onclick = function() {
            if (!state) {
                let count = dpel.querySelectorAll('span').length;
                dp.style.maxHeight = count * 30;
                dp.removeEventListener('transitionend', setBorderRound, false);

                btn.style.borderRadius = "5px 5px 0px 0px"

                state = true;
            } else {
                dp.style.maxHeight = 0;
                dp.addEventListener('transitionend', setBorderRound);

                state = false;
            }
        }

        this.registerUpdate = function(callback) {
            callbacks.update.push(callback)
        }
    }
}

export default DropDownManager;