import * as THREE from 'https://unpkg.com/three/build/three.module.js';

// declare global variables
let dialOrigin = { x: 0, y: 0 };

// define gamestate
let gamestate = {};

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
let geometry = new THREE.ConeGeometry(0.3);
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

// animate
animate();

// animate
animate();
function animate() {
    requestAnimationFrame(animate);

    update(); // before each render, update the scene based on gamestate

    renderer.render(scene, camera);
};

// update scene based on gamestate
function update() {
    player.rotation.z += 0.01;
}

// step/simulate the gamestate forward in time (based on input)
// setInterval(tick, 1000 / 30);
function tick() {

}

// configControls()
// Adds controls to dom
// Configures controls to listen for input
function configControls() {
    main.appendChild(controlsContainer);
    controlsContainer.appendChild(translate);
    controlsContainer.appendChild(dialContainer);
    dialContainer.appendChild(dial);

    controlsContainer.setAttribute('class','controls-container');
    dialContainer.setAttribute('class','dial-container');
    dial.setAttribute('class','dial');

    // window.onpointermove = () => {
    window.onclick = e => {
        let translateClicked = translate.contains(e.target);
        if (translateClicked) {
            console.log('yes');
            return;
        }
        console.log('no');
        // let x = window.event.clientX - dialOrigin.x;
        // let y = dialOrigin.y - window.event.clientY;
        // console.log(x, y);
        // console.log(Math.atan(y / x) / Math.PI * 180);
    }
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