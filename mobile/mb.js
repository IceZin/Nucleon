class NavManager {
    constructor(nav, navBtn) {
        let navActive = false;
        let openIcon = navBtn.querySelectorAll('i')[0];
        let closeIcon = navBtn.querySelectorAll('i')[1];

        navBtn.onclick = function() {
            if (!navActive) {
                nav.style.width = "60%";
                navBtn.style.left = "calc(20px + 60%)";
                openIcon.style.opacity = 0;
                closeIcon.style.opacity = 1;

                document.body.style.overflow = "hidden"
            } else {
                nav.style.width = "0";
                navBtn.style.left = "20px";
                openIcon.style.opacity = 1;
                closeIcon.style.opacity = 0;

                document.body.style.overflow = "scroll"
            }

            navActive = !navActive;
        }

        window.onscroll = function() {
            nav.style.height = "100%";
        }
    }
}

window.addEventListener("load", function() {
    let navmanager = new NavManager(document.getElementsByClassName('lnv')[0], document.getElementsByClassName('lnv-btn')[0]);
}, true)