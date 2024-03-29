const WsManager = require('./WsManager.js');

class User extends WsManager {
    constructor(username, password, token) {
        super(constructor)

        let active_dvc = null;
        let clientSyncThreads = {};
        let devices = {};

        this.name = username;
        this.password = password;
        this.token = token;

        this.registerSyncThread = function(id, thread) {
            if (clientSyncThreads[id] == null) {
                clientSyncThreads[id] = thread;
            }
        }

        this.unregisterSyncThread = function(id, thread) {
            if (clientSyncThreads[id] == null) {
                clientSyncThreads[id] = thread;
            }
        }

        this.registerDevice = function(id, dvc) {
            if (devices[id] == null) devices[id] = dvc;
        }

        this.unregisterDevice = function(id) {
            if (devices[id] != null) {
                devices[id].clearTimeouts();
                devices[id] = null;
            }
        }

        this.getDevice = function(id) {
            return devices[id];
        }

        this.getDevices = function() {
            return devices;
        }

        this.setActiveDevice = function(id) {
            active_dvc = id;
        }
    }
}

module.exports = User;