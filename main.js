let renderer = document.createElement('canvas');
document.body.appendChild(renderer);

let rotate = document.createElement('button');
let translate = document.createElement('button');
let div = document.createElement('div');
div.appendChild(rotate);
div.appendChild(translate);
document.body.appendChild(div);

let displacement = document.createElement('h1');
displacement.innerHTML = '&nbsp;';
document.body.appendChild(displacement);

let dragId = 0;
let dragStart;

window.onpointerup = e => {
    if (e.pointerId == dragId) {
        dragId = 0;
    }
}

rotate.onpointerdown = e => {
    dragId = e.pointerId;
    dragStart = e.pageX;
}

window.onpointermove = e => {
    if (e.pointerId == dragId) {
        displacement.textContent = e.pageX - dragStart;
    }
}


