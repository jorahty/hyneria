import * as THREE from 'three';
import { OutlineEffect } from 'https://unpkg.com/three/examples/jsm/effects/OutlineEffect.js';

// declare global variables
let dialOrigin = { x: 0, y: 0 };

// define gamestate
let gamestate = {};

let controls = {
    translate: false,
    rotateState: 'c'
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
});

// create camera
let camera = new THREE.PerspectiveCamera();
camera.position.z = 5;
camera.position.y = 3;
camera.rotation.x = -0.4;

// create renderer
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(512, 512);
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = 'auto';
renderer.outputEncoding = THREE.sRGBEncoding;
main.appendChild(renderer.domElement);

// define player geometry
// let geometry = new THREE.CapsuleGeometry(0.3, 1, 2, 3);
let geometry = new THREE.ConeGeometry(0.3, 3);
let material = new THREE.MeshBasicMaterial({ color: 0x020610 });
let player = new THREE.Mesh(geometry, material);
player.rotation.x = - Math.PI / 2;
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
    effect.render(scene, camera);
};

// update scene based on gamestate
function update() {
    // player.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), 0.01);
}

// step/simulate the gamestate forward in time (based on input)
setInterval(tick, 1000 / 30);
function tick() {
    if (controls.translate) {
        player.translateY(0.04);
    }

    if (controls.rotateState == 't') {
        player.rotation.x -= 0.04;
        return;
    }

    if (controls.rotateState == 'b') {
        player.rotation.x += 0.04;
        return;
    }

    if (controls.rotateState == 'l') {
        player.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), 0.04);
        return;
    }

    if (controls.rotateState == 'r') {
        player.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -0.04);
        return;
    }

    if (controls.rotateState == 'tr') {
        // player.rotation.x -= 0.04;
        // player.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -0.04);
        return;
    }
}

// for managing input 
let translateIds = new Set();
let rotateId = null;
let currentRotateState = 'c';
let rotateStates = ['r', 'tr', 't', 'tl', 'l', 'bl', 'b', 'br', 'c'];

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

    // listen for pointer down
    window.onpointerdown = e => {
        // is it a translate pointer?
        if (translate.contains(e.target)) {
            input('go');
            translateIds.add(e.pointerId);
            return;
        }
        // it's a rotate pointer
        rotateId = e.pointerId; // set it to THE rotate pointer
        checkAngle(); // check if triggers new rotate state
    }

    window.onpointerup = e => {
        // is it a translate pointer?
        if (translate.contains(e.target)) {
            input('stop');
            translateIds.delete(e.pointerId);
        }
        // is it the rotate pointer?
        if (e.pointerId == rotateId) {
            input('c');
            currentRotateState = 'c';
            rotateId = null;
        }
    }

    window.onpointermove = e => {
        if (e.pointerId != rotateId) return;
        checkAngle(); // check if triggers new rotate state
    }
}

// check if angle calls for rotate dial to be updated
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
        if (currentRotateState != rs && inRange) {
            input(rs);
            currentRotateState = rs;
        }
    }
}

// handle input event
function input(code) {

    // 1. send code to server
    if (code == 'go') controls.translate = true;
    if (code == 'stop') controls.translate = false;
    controls.rotateState = code;

    // 2. style controls

    if (code == 'go' || code == 'stop') { // translate input?
        translate.style.background = (code == 'go') ? '#17346d' : '#15223c';
        return;
    }

    if (code == 'c') { // inactive rotate state?
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

function domPosition(el) {
    var rect = el.getBoundingClientRect();
    return {
        x: (rect.right + rect.left) / 2,
        y: (rect.bottom + rect.top) / 2
    }
}