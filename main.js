import * as THREE from 'https://unpkg.com/three/build/three.module.js';

// let gamestate = {
//     x:
//     y:
//     z:
//     hr:
//     vr:
// };

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

// define player geometry
let geometry = new THREE.ConeGeometry(0.3);
let material = new THREE.MeshBasicMaterial({ color: 0x020610 });
let player = new THREE.Mesh(geometry, material);
player.rotation.x = - Math.PI / 2;
scene.add(player);

// create camera
let camera = new THREE.PerspectiveCamera();
camera.position.z = 5;
camera.position.y = 3;
camera.rotation.x = -0.4;

// create renderer
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(512, 512);
renderer.setClearColor(0x444444);
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = 'auto';
renderer.outputEncoding = THREE.sRGBEncoding;
main.appendChild(renderer.domElement);

// animate
animate();

// create controls
let rotate = document.createElement('button');
let translate = document.createElement('button');
let controlsContainer = document.createElement('div');
configControls();

// scale app (and decorate renderer)
window.onresize = scaleApp;
scaleApp();

// ██ helper functions

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

// scaleApp()
// Sets the size and width of the 'main' element.
function scaleApp() {
    let windowAspectRatio = window.innerWidth / window.innerHeight;
    let appAspectRatio = 2 / 3.4;
    if (windowAspectRatio > appAspectRatio) {
        // maximize height, compute width accordingly
        main.style.height = (window.innerHeight).toString() + 'px'
        main.style.width = ((window.innerHeight) * appAspectRatio).toString() + 'px';
        renderer.domElement.style.borderWidth = '2px';
        renderer.domElement.style.borderRadius = '20px';
        controlsContainer.style.padding = '10px 0';
    } else {
        // maximize width, compute height accordingly
        main.style.width = (window.innerWidth).toString() + 'px';
        main.style.height = (window.innerWidth * 1 / appAspectRatio).toString() + 'px';
        renderer.domElement.style.borderWidth = '2px 0 2px 0';
        renderer.domElement.style.borderRadius = '0';
        controlsContainer.style.padding = '10px';
    }
}

// on touch move,
//  if touch id is the drag id
//     compute panOffset (from initPanPosition)
//     use offset to set playerRotation relative to initPlayerRotation
//     keep vertical rotation in range


// controls should listen for input,
// and modify the *gamestate* accordingly
function configControls() {
    rotate.setAttribute('class','rotate');
    controlsContainer.setAttribute('class','controls-container');
    controlsContainer.appendChild(rotate);
    controlsContainer.appendChild(translate);
    main.appendChild(controlsContainer);

    let displacement = document.createElement('h1');
    displacement.style.margin = '0';
    displacement.innerHTML = '&nbsp;';
    displacement.style.position = 'absolute';
    displacement.style.top = '0%';
    document.body.appendChild(displacement);

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
}