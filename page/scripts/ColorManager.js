function gbc(cl) {
    return document.getElementsByClassName(cl);
}

class ColorManager {
    constructor() {
        let colors = {
            'hex': '000000',
            'rgb': [0, 0, 0]
        }
        let callbacks = {};

        let slidersBox = gbc('it1')[0].querySelectorAll('input[type=range]');
        let hex = gbc('hex')[0].querySelector('input');
        let rgbBoxes = gbc('rgb')[0].querySelectorAll('input');

        let syncBox = () => {
            gbc('it1')[0].querySelector('div[class=el3]').querySelector('div').style.backgroundColor = '#' + colors.hex;
        }

        let syncHex = () => {
            let clr = "";

            for (let i = 0; i < 3; i++) {
                let hex = parseInt(colors.rgb[i]).toString(16).toUpperCase();
                if (hex.length < 2) hex = '0' + hex;
                clr += hex;
            }

            hex.value = clr;
            colors.hex = clr;
        }

        let syncSliders = () => {
            slidersBox.forEach((slider, index) => {
                let len = (100 * colors.rgb[index]) / 255;
                slider.style.background = `linear-gradient(90deg, rgb(201, 238, 242) ${len}%, rgb(197, 197, 197) ${len}%)`
                slider.value = colors.rgb[index];
            });
        }

        let slidermng = (slider, i) => {
            let len = (100 * slider.value) / 255;
            slider.style.background = `linear-gradient(90deg, rgb(201, 238, 242) ${len}%, rgb(197, 197, 197) ${len}%)`

            colors.rgb[i] = parseInt(slider.value);
            rgbBoxes[i].value = slider.value;

            syncHex();
            syncBox();

            updateCallbacks();
        }

        let rgbmng = (box, i) => {
            if (box.value <= 255 && box.value >= 0) {
                colors.rgb[i] = parseInt(box.value);
                slidersBox[i].value = box.value;
            }

            syncHex();
            syncSliders();
            syncBox();

            updateCallbacks();
        }

        let hexmng = (hex) => {
            try {
                let hexval = parseInt(hex.value, 16);

                for (let i = 0; i < 3; i++) {
                    let clr = (hexval >> ((2 - i) * 8)) & 255;
                    colors.rgb[i] = clr;
                    slidersBox[i].value = clr;
                    rgbBoxes[i].value = clr;
                }

                colors.hex = hex.value;

                syncSliders();
                syncBox();

                updateCallbacks();
            } catch (err) {
                console.log(err);
            }
        }

        hex.oninput = function() {
            hexmng(this);
        }

        rgbBoxes.forEach(function(box, index) {
            box.oninput = function() {
                rgbmng(this, index);
            }
        });

        slidersBox.forEach(function(slider, index) {
            slider.oninput = function() {
                slidermng(this, index);
            }; 
        });

        this.setColor = (clr) => {
            colors.rgb = clr;

            syncHex();
            syncSliders();
            syncBox();
            
            clr.forEach((color, index) => {
                rgbBoxes[index].value = color;
            })
        }

        this.getColor = () => {
            return colors.rgb;
        }

        let updateCallbacks = function() {
            Object.keys(callbacks).forEach(addr => {
                callbacks[addr](colors.rgb);
            })
        }

        this.registerCallback = function(address, callback) {
            callbacks[address] = callback;
        }

        this.unregisterCallback = function(address) {
            delete callbacks[address];
        }
    }
}

export default ColorManager;