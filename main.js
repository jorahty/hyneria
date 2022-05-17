let main = document.createElement('main');
document.body.appendChild(main);
scaleApp();

window.onresize = scaleApp;
function scaleApp() {
    let windowAspectRatio = window.innerWidth / window.innerHeight;
    let appAspectRatio = 2 / 3;
    if (windowAspectRatio > appAspectRatio) {
        console.log('landscape');
        main.style.height = (window.innerHeight - 40).toString() + 'px'
        main.style.width = ((window.innerHeight - 40) * 2 / 3).toString() + 'px';
    } else {
        main.style.width = '100%';
        let height = (window.innerWidth * 3 / 2).toString() + 'px';
        console.log(height);
        main.style.height = height
    }
}



let renderer = document.createElement('canvas');
renderer.width = 100;
renderer.height = 100;
main.appendChild(renderer);

let rotate = document.createElement('button');
let translate = document.createElement('button');
let div = document.createElement('div');
div.appendChild(rotate);
div.appendChild(translate);
main.appendChild(div);

// let displacement = document.createElement('h1');
// displacement.innerHTML = '&nbsp;';
// document.body.appendChild(displacement);

// let dragId = 0;
// let dragStart;

// window.onpointerup = e => {
//     if (e.pointerId == dragId) {
//         dragId = 0;
//     }
// }

// rotate.onpointerdown = e => {
//     dragId = e.pointerId;
//     dragStart = e.pageX;
// }

// window.onpointermove = e => {
//     if (e.pointerId == dragId) {
//         displacement.textContent = e.pageX - dragStart;
//     }
// }


