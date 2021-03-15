class ProfilesManager {
    constructor(managers, btn, screen) {
        let scr_active = false;

        btn.onclick = function() {
            if (scr_active) {
                screen.style.transform = "scale(0)";
            } else {
                screen.style.transform = "scale(1)";
            }
        }
    }
}

export default ProfilesManager;