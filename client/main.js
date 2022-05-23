// hyneria
// https://hyneria.com
// Jorah Ty (jorahty.com)

import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';

(function Hyneria() {

  // declare global variables
  let gamestate = {};
  let scene, camera, renderer;
  let myId;
  let socket;

  (function Init() {

    // connect to the server and record myId
    socket = io();
    socket.on('id', id => { myId = id; });

    // upon recieving update from server, update gamestate
    socket.on('update', gs => { gamestate = gs; });

    scene = createScene(); // create scene

    camera = createCamera(); // create camera

    renderer = createRenderer(); // create renderer
    
    Animate(); // start rendering gamestate

    Controls(); // create & configure controls

    // style dom depending on window aspect ratio
    addEventListener('resize', styleDom);
    styleDom();
  })();

  // Animate()
  // continuously render the scene from the camera
  function Animate() {
    requestAnimationFrame(Animate);
    
    Update(); // before each frame, update scene and camera per gamestate
    
    renderer.render(scene, camera)
  }

  // Update()
  // update scene and camera based on gamestate
  function Update() {

    for (let id in gamestate) { // for each player in gamestate

      let mesh = scene.getObjectByName(id);

      // add player if not already in scene
      if (mesh === undefined) {
        let material = new THREE.MeshMatcapMaterial({ color: Math.random() * 0xffffff });
        mesh = new THREE.Mesh(scene.playerGeometry, material);
        mesh.name = id;
        scene.add(mesh);
      }

      let t = 0.2;
      let player = gamestate[id];

      // update player position
      let newpos = new THREE.Vector3(player.p[0], player.p[1], player.p[2]);
      mesh.position.lerp(newpos, t);

      // update player rotation
      let q = new THREE.Quaternion();
      q.setFromEuler(new THREE.Euler(player.r[1], 0, 0, 'XYZ'));
      let obj = new THREE.Object3D();
      obj.quaternion.copy(q);
      obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), player.r[0]);
      mesh.quaternion.slerp(obj.quaternion, t);

      // focus camera if player has myId
      if (id == myId) focusCameraOn(mesh);
    }

    // remove absent players
    removeAbsent();
  }

  // Controls()
  // create and configure controls to listen for user input and call Input() accordingly
  function Controls() {

    // for managing input
    let currentAngle = 0;
    let dialOrigin = { x: 0, y: 0 };
    let translateIds = new Set();
    let rotateId = null;
    let rotateStates = ['d', 'wd', 'w', 'wa', 'a', 'sa', 's', 'sd', ''];
    let controls = { translate: false, rotateState: '' }

    // create control dom elements
    let controlsContainer = document.createElement('section');
    let translate = document.createElement('button');
    let dialContainer = document.createElement('div');
    let dial = document.createElement('div');

    // append controls to dom
    document.querySelector('main').appendChild(controlsContainer);
    controlsContainer.appendChild(translate);
    controlsContainer.appendChild(dialContainer);
    dialContainer.appendChild(dial);

    // set classes for styling
    controlsContainer.setAttribute('class','controls-container');
    dialContainer.setAttribute('class','dial-container');
    dial.setAttribute('class','dial');
    
    document.onpointerdown = e => {
      // is it a translate pointer?
      if (translate.contains(e.target) && controls.translate == false) {
        Input('go');
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
        Input('stop');
        translateIds.delete(e.pointerId);
      }
      // is it the rotate pointer?
      if (e.pointerId == rotateId) {
        Input('');
        rotateId = null;
      }
    }

    document.onpointermove = e => {
      if (e.pointerId != rotateId) return;
      checkAngle(); // check if triggers new rotate state
    }

    document.onkeydown = e => {
      if (e.key == ' ' && controls.translate === false) {
        Input('go');
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

      Input(controls.rotateState);
    }

    document.onkeyup = e => {
      if (e.key == ' ') {
        Input('stop');
        return;
      }

      if (controls.rotateState.includes(e.key) == false) return;
      controls.rotateState = controls.rotateState.replace(e.key, '');
      Input(controls.rotateState);
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
            Input(rs);
        }
      }
    }

    // Input()
    // send input to server
    // style controls for visual confirmation of input
    function Input(code) {

      // 1. send code to server
      socket.volatile.emit('input', code);

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
      currentAngle = closestEquivalentAngle(currentAngle, dialAngle)

      // rotate dial
      dial.style.transform = `rotate(${-currentAngle}deg)`;

      // 3. (maybe use for client-side prediction)
    }
    
    addEventListener('resize', getDialOrigin);
    addEventListener('pointerdown', getDialOrigin, {once : true});
    function getDialOrigin() {
      // get dial origin
      // (so that we can compare it to pointer position)
      let dialContainer = document.querySelector('.dial-container');
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

    function closestEquivalentAngle(from, to) {
      var delta = ((((to - from) % 360) + 540) % 360) - 180;
      return from + delta;
    }
  }

  // ██ helper functions ██

  function createScene() {
    let scene = new THREE.Scene();

    // define player geometry
    scene.playerGeometry = new THREE.BoxGeometry(0.2, 0.5, 1.2);

    // set background
    let textureLoader = new THREE.TextureLoader();
    textureLoader.load('./img/blue.jpg', texture => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.encoding = THREE.sRGBEncoding;
      scene.background = texture;
    });

    // decorate with particles
    for (let i = 0; i < 800; i++) {
      let sprite = new THREE.Sprite();
      sprite.scale.set(0.04, 0.04, 0.04)
      sprite.position.x = -20 + Math.random() * 40;
      sprite.position.y = -20 + Math.random() * 40;
      sprite.position.z = -20 + Math.random() * 40;
      scene.add(sprite);
    }

    return scene;
  }

  function createCamera() {
    let camera = new THREE.PerspectiveCamera(90);
    camera.currentPosition = new THREE.Vector3();
    camera.currentLookat = new THREE.Vector3();
    return camera;
  }

  function createRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(480, 480);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = 'auto';
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.querySelector('main').appendChild(renderer.domElement);
    return renderer;
  }

  // removeAbsent()
  // remove players from scene that are not in gamestate
  function removeAbsent() {
    let meshToDelete = [];
    scene.traverse(node => {
      if (node instanceof THREE.Mesh && node.name in gamestate === false) {
        meshToDelete.push(node); // don't modify scene while traversing it
      }
    });
    for (let mesh of meshToDelete) {
      mesh.material.dispose();
      mesh.geometry.dispose();
      renderer.renderLists.dispose();
      scene.remove(mesh); // now you can modify (delete mesh from) the scene
    }
  }

  // focusCameraOn()
  // position and rotate the camera with respect to player
  function focusCameraOn(player) {
    let t = 0.2;

    // position camera
    let idealOffset = new THREE.Vector3(0, 1.5, 3);
    idealOffset.applyQuaternion(player.quaternion);
    idealOffset.add(player.position);
    camera.position.lerp(idealOffset, t);

    // point camera
    let idealLookat = new THREE.Vector3(0, 1.5, 0);
    idealLookat.applyQuaternion(player.quaternion);
    idealLookat.add(player.position);
    camera.currentLookat.lerp(idealLookat, t);
    camera.lookAt(camera.currentLookat);
  }

  // styleDom()
  // style dom with respect to window aspect ratio
  function styleDom() {
    let main = document.querySelector('main');
    let canvas = document.querySelector('canvas');
    let controlsContainer = document.querySelector('.controls-container');
    let topMargin = 0.013 * window.innerHeight;

    let appAspectRatio = 0.6;
    let windowAspectRatio = window.innerWidth / window.innerHeight;

    if (windowAspectRatio > appAspectRatio) {

      // maximize height, compute width accordingly
      main.style.height = (window.innerHeight - topMargin).toString() + 'px';
      main.style.width = ((window.innerHeight - topMargin) * appAspectRatio).toString() + 'px';
      main.style.marginTop = (topMargin).toString() + 'px';
      canvas.style.borderWidth = '2px';
      canvas.style.borderRadius = '2vh';
      controlsContainer.style.padding = '1.3vh 0';

    } else {

      // maximize width, compute height accordingly
      main.style.width = (window.innerWidth).toString() + 'px';
      main.style.height = (window.innerWidth * 1 / appAspectRatio).toString() + 'px';
      main.style.marginTop = '0';
      canvas.style.borderWidth = '2px 0 2px 0';
      canvas.style.borderRadius = '0';
      controlsContainer.style.padding = '1.3vh';

    }
  }
})();