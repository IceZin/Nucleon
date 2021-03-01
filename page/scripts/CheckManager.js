class CheckManager {
    constructor(arr, btns, lockNull) {
        let selected = null;
        let callback = null;

        arr.forEach((btn, index) => {
            if (lockNull && index == 0) {
                btns[index].style.backgroundColor = "#3ba4d0";
                selected = 0;
            }

            btn.onclick = function() {
                if (selected == null) {
                    btns[index].style.backgroundColor = "#3ba4d0";
                    selected = index;
                } else {
                    if (selected != index) {
                        btns[selected].style.backgroundColor = "#364043";
                        btns[index].style.backgroundColor = "#3ba4d0";
                        selected = index
                    } else {
                        if (!lockNull) {
                            btns[selected].style.backgroundColor = "#364043";
                            selected = null;
                        }
                    }
                }

                if (callback) callback(selected);
            }
        })

        this.registerUpdate = (cb) => {
            cb(selected);
            callback = cb;
        }
    }
}

export default CheckManager;