import * as THREE from 'three';
import { OutlineEffect } from 'https://unpkg.com/three/examples/jsm/effects/OutlineEffect.js';

let renderer;
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

// declare global variables
let dialOrigin = { x: 0, y: 0 };

// define gamestate
let gamestate = {};

// SERVER
let controls = {
    translate: false,
    rotateState: ''
}

// establish connection to server

// upon recieving update from server, update gamestate

// create 'main' element
let main = document.createElement('main');
document.body.appendChild(main);

// create scene
let scene = new THREE.Scene();
let textureLoader = new THREE.TextureLoader();
textureLoader.load('https://cse120.jorahty.repl.co/blue.jpg', texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.encoding = THREE.sRGBEncoding;
    scene.background = texture;
    renderer.domElement.style.display = 'block';
    adaptToWindowSize();
});

// decorate scene with plankton
decorate();

// create camera
let camera = new THREE.PerspectiveCamera();
camera.position.z = 5;
camera.position.y = 3;
camera.rotation.x = -0.4;

// create renderer
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(512, 512);
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = 'auto';
renderer.domElement.style.display = 'none';
renderer.outputEncoding = THREE.sRGBEncoding;
main.appendChild(renderer.domElement);

// define player geometry
let geometry = new THREE.ConeGeometry(0.3);
let material = new THREE.MeshMatcapMaterial({ color: 0x0d5c43 });
let player = new THREE.Mesh(geometry, material);
player.quaternion.copy(new THREE.Quaternion());
let phi = 0;
let theta = - Math.PI / 2;
updateRotation(0, 0);
scene.add(player);

// create controls
let controlsContainer = document.createElement('section');
let translate = document.createElement('button');
let dialContainer = document.createElement('div');
let dial = document.createElement('div');
configControls();

// adapt to window size
adaptToWindowSize();
window.onresize = adaptToWindowSize;

// init outline effect
let effect = new OutlineEffect( renderer, {
    defaultThickness: 0.007,
    defaultColor: [ 0, 0, 0 ],
    defaultKeepAlive: true,
});

// animate
animate();
function animate() {
    requestAnimationFrame(animate);

    update(); // before each render, update the scene based on gamestate

    // renderer.render(scene, camera);
    // effect.render(scene, camera);
    renderer.render(scene, camera);
};

// update scene based on gamestate
function update() {
    
    // focus camera on player
    const idealOffset = new THREE.Vector3(0, -5, 3);
    idealOffset.applyQuaternion(player.quaternion);
    idealOffset.add(player.position);
    camera.position.copy(idealOffset);

    const idealLookat = new THREE.Vector3(0, 2.5, 0);
    idealLookat.applyQuaternion(player.quaternion);
    idealLookat.add(player.position);
    camera.lookAt(idealLookat);

}



// SERVER
// update player's rotation
function updateRotation(xh, yv) {
    phi += xh;
    theta += yv;
    theta = clamp(theta, -Math.PI + 0.39, 0);

    let q = new THREE.Quaternion();
    q.setFromEuler(new THREE.Euler(theta, 0, 0, 'XYZ'));
    player.quaternion.copy(q);

    player.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), phi);
}


// SERVER
// step/simulate the gamestate forward in time (based on input)
setInterval(tick, 1000 / 20);
function tick() {
    if (controls.translate) {
        player.translateY(0.07);
    }

    switch (controls.rotateState) {
    case 'w': updateRotation(0, 0.1); break;
    case 's': updateRotation(0, -0.1); break;
    case 'a': updateRotation(0.1, 0); break;
    case 'd': updateRotation(-0.1, 0); break;
    case 'wd': updateRotation(-0.05, 0.05); break;
    case 'wa': updateRotation(0.05, 0.05); break;
    case 'sa': updateRotation(0.05, -0.05); break;
    case 'sd': updateRotation(-0.05, -0.05); break;
    }
}

// for managing input 
let translateIds = new Set();
let rotateId = null;
let rotateStates = ['d', 'wd', 'w', 'wa', 'a', 'sa', 's', 'sd', ''];

// configControls()
// Adds controls to dom
// Configures controls to listen for input
function configControls() {

    // append controls to dom
    main.appendChild(controlsContainer);
    controlsContainer.appendChild(translate);
    controlsContainer.appendChild(dialContainer);
    dialContainer.appendChild(dial);

    // set classes for styling
    controlsContainer.setAttribute('class','controls-container');
    dialContainer.setAttribute('class','dial-container');
    dial.setAttribute('class','dial');

    // listen for input
    document.onpointerdown = e => {
        // is it a translate pointer?
        if (translate.contains(e.target) && controls.translate == false) {
            input('go');
            translateIds.add(e.pointerId);
            return;
        }
        // it's a rotate pointer
        rotateId = e.pointerId; // set it to THE rotate pointer
        checkAngle(); // check if triggers new rotate state
    }

    document.onpointerup = e => {
        // is it a translate pointer?
        if (translate.contains(e.target)) {
            input('stop');
            translateIds.delete(e.pointerId);
        }
        // is it the rotate pointer?
        if (e.pointerId == rotateId) {
            input('');
            rotateId = null;
        }
    }

    document.onpointermove = e => {
        if (e.pointerId != rotateId) return;
        checkAngle(); // check if triggers new rotate state
    }

    document.onkeydown = e => {
        if (e.key == ' ') {
            input('go');
            return;
        }

        if ('wasd'.includes(e.key) == false) return;

        if (controls.rotateState.includes(e.key)) return;

        if (controls.rotateState.length >= 2) return;

        if (e.key == 'w' || e.key == 's') {
            controls.rotateState = e.key + controls.rotateState; // prepend
        } else {
            controls.rotateState += e.key; // append
        }

        input(controls.rotateState);
    }

    document.onkeyup = e => {
        if (e.key == ' ') {
            input('stop');
            return;
        }

        if (controls.rotateState.includes(e.key) == false) return;
        controls.rotateState = controls.rotateState.replace(e.key, '');
        input(controls.rotateState);
    }
}

// checkAngle()
// checkes if angle calls for input event
// used when listening for pointer move
function checkAngle() {
    
    // compute angle
    // (direction of pointer relative to dial)
    let x = window.event.clientX - dialOrigin.x;
    let y = dialOrigin.y - window.event.clientY;
    let angle = Math.floor(Math.atan(y / x) / Math.PI * 180);
    if (x < 0) angle += 180;
    if (y < 0 && x > 0) angle += 360;

    // check if angle is in each rs range
    angle = (angle + 22.5) % 360;
    for (let i = 0; i < 8; i++) {
        let rs = rotateStates[i];
        let inRange = angle > i * 45 && angle < i * 45 + 45;

        // if not already in rs and angle is in rs range
        if (controls.rotateState != rs && inRange) {
            input(rs);
        }
    }
}

// handle input event
function input(code) {

    // 1. send code to server
    if (code == 'go') controls.translate = true;
    if (code == 'stop') controls.translate = false;

    // 2. style controls

    if (code == 'go' || code == 'stop') { // translate input?
        translate.style.background = (code == 'go') ? '#17346d' : '#15223c';
        return;
    }

    controls.rotateState = code;

    if (code == '') { // inactive rotate state?
        dial.style.width = '16%';
        dial.style.background = '#15223c';
        return;
    }

    // active rotate state
    dial.style.width = '95%';
    dial.style.background = 'linear-gradient(to right, #15223c, #17346d)';

    // compute dial angle
    let index = rotateStates.indexOf(code);
    let dialAngle = index * 45;

    // rotate dial
    dial.style.transform = `rotate(${-dialAngle}deg)`;

    // 3. (maybe use for client-side prediction)
}

function adaptToWindowSize() {
    // adjust dom with respect to window aspectRatio
    let windowAspectRatio = window.innerWidth / window.innerHeight;
    let appAspectRatio = 0.6;
    let topMargin = 0.013 * window.innerHeight;
    if (windowAspectRatio > appAspectRatio) {
        // maximize height, compute width accordingly
        main.style.height = (window.innerHeight - topMargin).toString() + 'px';
        main.style.width = ((window.innerHeight - topMargin) * appAspectRatio).toString() + 'px';
        renderer.domElement.style.borderWidth = '2px';
        renderer.domElement.style.borderRadius = '2vh';
        controlsContainer.style.padding = '1.3vh 0';
        main.style.marginTop = (topMargin).toString() + 'px';
    } else {
        // maximize width, compute height accordingly
        main.style.width = (window.innerWidth).toString() + 'px';
        main.style.height = (window.innerWidth * 1 / appAspectRatio).toString() + 'px';
        renderer.domElement.style.borderWidth = '2px 0 2px 0';
        renderer.domElement.style.borderRadius = '0';
        controlsContainer.style.padding = '1.3vh';
        main.style.marginTop = '0';
    }

    // get dial origin
    // (so that we can compare it to pointer position)
    dialOrigin = domPosition(dialContainer)
}

// returns {x, y} coordinates of dom element el
function domPosition(el) {
    var rect = el.getBoundingClientRect();
    return {
        x: (rect.right + rect.left) / 2,
        y: (rect.bottom + rect.top) / 2
    }
}

// decorate scene with plankton
function decorate() {
    for (let i = 0; i < 6400; i++) {
        // let material = new THREE.MeshBasicMaterial( {color: 0x0055ff} );
        let sprite = new THREE.Sprite();
        sprite.scale.set( 0.03, 0.03, 0.03 )
        sprite.position.x = -20 + Math.random() * 40;
        sprite.position.y = -20 + Math.random() * 40;
        sprite.position.z = -20 + Math.random() * 40;
        scene.add(sprite);
    }
}