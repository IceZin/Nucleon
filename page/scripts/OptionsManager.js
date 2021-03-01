class OptionsManager {
    constructor(managers) {
        let opts = document.getElementsByClassName('opts')[0].childNodes;

        let methods = {
            "set": managers.dvcmanager.sendCmd
        }

        opts.forEach(opt => {
            opt.onclick = function() {
                try {
                    methods[opt.id]();
                } catch (err) {

                }
            }
        });
    }
}

export default OptionsManager;