// hyneria
// https://hyneria.com
// Jorah Ty (jorahty.com)

import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';

(function Hyneria() {

  // declare global variables
  let gamestate = {};
  let scene, camera, renderer;
  let myId;

  (function Init() {

    // connect to the server and record myId
    let socket = io();
    socket.on('connect', () => { myId = socket.id; console.log(myId); })

    // upon recieving update from server, update gamestate
    // socket.on('update', gs => { gamestate = gs; });

    scene = createScene(); // create scene

    camera = createCamera(); // create camera

    renderer = createRenderer(); // create renderer
    
    Animate(); // start rendering gamestate

    // Controls(); // create & configure controls

    // style dom depending on window aspect ratio
    addEventListener('resize', styleDom);
    styleDom();

    setInterval(Tick, 1000 / 40);

  })();

  // Tick()
  // step/simulate the gamestate forward in time based on controls
  // this will go on the server!
  function Tick() {
    for (let player of Object.values(gamestate)) {
      player.p[0] += 0.01 * Math.sin(Date.now() * 1e-3);
      player.p[1] = (-Math.PI + 0.39) * (Math.sin(Date.now()* 1e-3) + 1) / 2;
      player.r[0] += 0.01;
      player.r[1] += 0.01;
    }
  }

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

      // update player position
      let player = gamestate[id];
      mesh.position.x = player.p[0];
      mesh.position.y = player.p[1];
      mesh.position.z = player.p[2];

      // update player rotation
      let q = new THREE.Quaternion();
      q.setFromEuler(new THREE.Euler(player.r[1], 0, 0, 'XYZ'));
      let obj = new THREE.Object3D();
      obj.quaternion.copy(q);
      obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), player.r[0]);
      mesh.quaternion.copy(obj.quaternion);

      // focus camera if player has myId
      if (id === myId) focusCameraOn(mesh);
    }

    // remove absent players
    removeAbsent();
  }

  // Controls()
  // create and configure controls to listen for user input and call Input() accordingly
  function Controls() {
    
    Input('input code');

    // Input()
    // send input to server
    // style controls for visual confirmation of input
    function Input(code) {

    }
    
    addEventListener('resize', () => {
      // adjust controls
    });
  }

  // ██ helper functions ██

  function createScene() {
    let scene = new THREE.Scene();

    // define player geometry
    scene.playerGeometry = new THREE.ConeGeometry(0.3, 1, 4);

    // set background
    let textureLoader = new THREE.TextureLoader();
    textureLoader.load('./img/blue.jpg', texture => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.encoding = THREE.sRGBEncoding;
      scene.background = texture;
    });

    // decorate with particles
    for (let i = 0; i < 6400; i++) {
      let sprite = new THREE.Sprite();
      sprite.scale.set(0.03, 0.03, 0.03)
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
    renderer.setSize(512, 512);
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

  // focusCamera()
  // position and rotate the camera with respect to player
  function focusCameraOn(player) {
    let t = 0.2;

    // position camera
    let idealOffset = new THREE.Vector3(0, -2.5, 1.8);
    idealOffset.applyQuaternion(player.quaternion);
    idealOffset.add(player.position);
    camera.position.lerp(idealOffset, t);

    // point camera
    let idealLookat = new THREE.Vector3(0, 5, 0);
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
      // controlsContainer.style.padding = '1.3vh 0';

    } else {

      // maximize width, compute height accordingly
      main.style.width = (window.innerWidth).toString() + 'px';
      main.style.height = (window.innerWidth * 1 / appAspectRatio).toString() + 'px';
      main.style.marginTop = '0';
      canvas.style.borderWidth = '2px 0 2px 0';
      canvas.style.borderRadius = '0';
      // controlsContainer.style.padding = '1.3vh';

    }
  }
})();