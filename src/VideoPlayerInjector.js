import { log, err } from './helpers.js'

var video = document.getElementsByTagName("video")[0];

import * as THREE from 'three';
import {VRButton} from 'three/addons/webxr/VRButton.js'
//import XRButton from 'three/addons/jsm/VRButton'
//import OrbitControls from 'three/addons/controls/OrbitControls.js'
import WebXRPolyfill from 'webxr-polyfill';

var polyfill = null;

let camera, scene, renderer;
let videoPlane, videoTexture;
let controls = {};
let progressBar, barMaterial;

if(!video){
    log("No video, skipping injection.");
}else{
    polyfill = new WebXRPolyfill({
        global: window.wrappedJSObject, //!!!!!!!!!!!!
        webvr: true,
        cardboard: true,
        allowCardboardOnDesktop: true,
        cardboardConfig: {
            ADDITIONAL_VIEWERS: [
                {
                    id: 'Custom01',
                    label: 'Custom01',
                    fov: 60,
                    interLensDistance: 0.045,
                    baselineLensDistance: 0.035,
                    screenLensDistance: 0.039,
                    distortionCoefficients: [0.34, 0.55],
                    inverseCoefficients: [
                        -0.33836704, -0.18162185, 0.862655, -1.2462051,
                        1.0560602, -0.58208317, 0.21609078, -0.05444823, 0.009177956,
                        -9.904169E-4, 6.183535E-5, -1.6981803E-6]
                }
            ],

            DEFAULT_VIEWER: 'Custom01',
            PROVIDE_MOBILE_VRDISPLAY: true,

            //---Options passed into the underlying CardboardVRDisplay
            MOBILE_WAKE_LOCK: true,
            DEBUG: false,
            DPDB_URL: 'https://storage.googleapis.com/cardboard-dpdb/dpdb.json',
            K_FILTER: 0.98,
            PREDICTION_TIME_S: 0.040,
            CARDBOARD_UI_DISABLED: false, // Default: false
            ROTATE_INSTRUCTIONS_DISABLED: true, // Default: false.
            YAW_ONLY: false ,
            BUFFER_SCALE: 1.5,
            DIRTY_SUBMIT_FRAME_BINDINGS: false,
        }
    });

    log("WebXRPolyfill instantiated.");
    log("Video found: ", null, video);

    init();
    animate();
}

function init() {

    log("Starting", "init")

    video.play()
    videoTexture = new THREE.VideoTexture(video);
    //videoTexture.colorSpace = THREE.SRGBColorSpace;
    //videoTexture.minFilter = THREE.LinearFilter;
    //videoTexture.magFilter = THREE.LinearFilter;
    //videoTexture.format = THREE.RGBAFormat;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 1;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));

    // Skybox
    const loader = new THREE.TextureLoader();
    const texture = loader.load([
        'box.png',

    ]);
    scene.background = texture;

    // Video Plane
    const geometry = new THREE.PlaneGeometry(1.6, 0.9);
    const material = new THREE.MeshBasicMaterial({ map: videoTexture });
    videoPlane = new THREE.Mesh(geometry, material);
    videoPlane.position.set(0, 0, -1.5);
    scene.add(videoPlane);

    // Controls
    createButton('▶', -0.6, -1.5, () => video.play());
    createButton('⏪', -0.9, -1.5, () => { video.currentTime = Math.max(0, video.currentTime - 5); });
    createButton('⏩', -0.3, -1.5, () => { video.currentTime = Math.min(video.duration, video.currentTime + 5); });

    // Progress Bar
    const barGeometry = new THREE.PlaneGeometry(1.2, 0.05);
    barMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    progressBar = new THREE.Mesh(barGeometry, barMaterial);
    progressBar.position.set(0, -0.9, -1.5);
    scene.add(progressBar);

    window.addEventListener('resize', onWindowResize);
}

function createButton(label, x, y, onClick) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const geo = new THREE.PlaneGeometry(0.3, 0.3);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, -1.5);
    scene.add(mesh);

    controls[label] = mesh;
    // For future interactivity (e.g., raycasting): store click handler
    mesh.userData.onClick = onClick;
}

function updateProgressBar() {
    if (!video.duration) return;
    const ratio = video.currentTime / video.duration;
    progressBar.scale.x = ratio;
    progressBar.position.x = -0.6 + ratio * 0.6;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    updateProgressBar();
    renderer.render(scene, camera);
}