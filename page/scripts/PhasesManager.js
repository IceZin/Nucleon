class PhasesManager {
    constructor(managers) {
        let phasesBox = document.getElementById("phasebox");
        let phasesContent = phasesBox.querySelector(".phases");
        let phases = phasesBox.querySelectorAll(".phase");

        let activePhase;
        let phase_i;
        let phasesColor = [];
        
        phasesBox.querySelector('#add').onclick = function() {
            let color = managers.clrmanager.getColor();
            let ph_i = phases.length;

            let phase = `
            <div class="phase">
                <div id="name">
                    <h1>Phase ${ph_i + 1}</h1>
                </div>
                <div id="color">
                    <div>${color[0]}</div>
                    <div>${color[1]}</div>
                    <div>${color[2]}</div>
                </div>
            </div>
            `;

            phasesContent.insertAdjacentHTML('beforeend', phase);
            phases = phasesBox.querySelectorAll(".phase");

            phase = phases[ph_i];

            phasesColor.push(Array.from(color));

            phase.onclick = function() {
                let label = phase.querySelector("#name");
                
                for (let i = 0; i < phases.length; i++) {
                    if (phases[i] == phase) {
                        ph_i = i;
                        break;
                    }
                }

                if (activePhase == null) {
                    label.style.width = 140;
                    label.style.backgroundColor = "#3ba4d0";

                    activePhase = phase;
                    phase_i = ph_i;

                    enableColorSync(ph_i);
                } else {
                    if (activePhase != phase) {
                        activePhase.querySelector("#name").style.width = 80;
                        activePhase.querySelector("#name").style.backgroundColor = "#364043";

                        label.style.width = 140;
                        label.style.backgroundColor = "#3ba4d0";

                        disableColorSync(phase_i);

                        activePhase = phase;
                        phase_i = ph_i;

                        enableColorSync(ph_i);
                    } else {
                        disableColorSync(phase_i);

                        label.style.width = 80;
                        label.style.backgroundColor = "#364043";

                        activePhase = null;
                        phase_i = null;
                    }
                }
            } 
        }

        phasesBox.querySelector("#remove").onclick = function() {
            if (activePhase) {
                activePhase.remove();
                phases = phasesBox.querySelectorAll(".phase");

                disableColorSync(phase_i);
                adjustIndexes(phase_i);

                phasesColor.splice(phase_i, 1);

                activePhase = null;
                phase_i = null;
            }
        }

        let enableColorSync = function(index) {
            managers.clrmanager.setColor(phasesColor[index]);

            managers.clrmanager.registerCallback(`phase${index}`, function(color) {
                let clr_divs = phases[index].querySelectorAll("#color div");
                let i = 0;

                clr_divs.forEach(div => {
                    div.innerHTML = color[i++];
                });

                phasesColor[index] = Array.from(color);
            });
        }

        let disableColorSync = function(index) {
            managers.clrmanager.unregisterCallback(`phase${index}`);
        }

        let adjustIndexes = function(index) {
            for (let i = index; i < phases.length; i++) {
                phases[i].querySelector("#name h1").innerHTML = "Phase " + (i + 1);
            }
        }

        let getPhases = function() {

        }
    }
}

export default PhasesManager;