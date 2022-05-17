// create 'main' element
let main = document.createElement('main');
document.body.appendChild(main);
scaleApp();
window.onresize = scaleApp;

// create renderer
let renderer = document.createElement('canvas');
renderer.width = 100;
renderer.height = 100;
main.appendChild(renderer);

// create controls
let rotate = document.createElement('button');
rotate.setAttribute('class','rotate');
let translate = document.createElement('button');
let controlsContainer = document.createElement('div');
controlsContainer.setAttribute('class','controls-container');
controlsContainer.appendChild(rotate);
controlsContainer.appendChild(translate);
main.appendChild(controlsContainer);

let displacement = document.createElement('h1');
displacement.style.margin = '0';
displacement.innerHTML = '&nbsp;';
main.appendChild(displacement);

let dragId = 0;
let dragStart;

window.onpointerup = e => {
    if (e.pointerId == dragId) {
        dragId = 0;
        rotate.style.background = '#333';
    }
}

translate.onpointerdown = e => {
    translate.style.background = '#484';
}

translate.onpointerup = e => {
    translate.style.background = '#333';
}

rotate.onpointerdown = e => {
    rotate.style.background = '#484';
    dragId = e.pointerId;
    dragStart = e.pageX;
}

window.onpointermove = e => {
    if (e.pointerId == dragId) {
        displacement.textContent = e.pageX - dragStart;
    }
}

// scaleApp()
// Sets the size and width of the 'main' element.
function scaleApp() {
    let windowAspectRatio = window.innerWidth / window.innerHeight;
    let appAspectRatio = 2 / 3;
    let verticalMargin = 40;
    if (windowAspectRatio > appAspectRatio) {
        // maximize height, compute width accordingly
        main.style.height = (window.innerHeight - verticalMargin).toString() + 'px'
        main.style.width = ((window.innerHeight - verticalMargin) * appAspectRatio).toString() + 'px';
    } else {
        // maximize width, compute height accordingly
        main.style.width = (window.innerWidth).toString() + 'px';
        main.style.height = (window.innerWidth * 1 / appAspectRatio).toString() + 'px';
    }
}