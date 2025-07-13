import { log, err } from '../common/LogHelper.js'
import styles from "./injector.css"; /* import the styles as a string */

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
    console.log(init)
    console.log(animate)
    log("No video, skipping injection.");
}else{

    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);
    log("Injected styles", null, style)

    polyfill = new WebXRPolyfill(window.VR_CONFIG);

    log("WebXRPolyfill instantiated." , "pre-init", polyfill);
    log("Video found: ", null, video);

    init();
    animate();
}


// Hello

function init() {
    log("Starting", "init");

    // Start video
    video.play();
    videoTexture = new THREE.VideoTexture(video);

    // Setup scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 1;

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.domElement.classList.add("webgl");

    // Create modal overlay container
    const modal = document.createElement('div');
    modal.id = 'vr-overlay-modal';

    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'vr-canvas-container';

    canvasContainer.appendChild(renderer.domElement);
    modal.appendChild(canvasContainer);

    // Add Start button
    const startButton = document.createElement('button');
    startButton.id = 'vr-start-button';
    startButton.textContent = 'Enter VR';
    startButton.onclick = () => {
        modal.removeChild(startButton); // Remove button after click
        document.body.appendChild(VRButton.createButton(renderer));
    };
    modal.appendChild(startButton);

    // Add Close button
    const closeButton = document.createElement('button');
    closeButton.id = 'vr-close-button';
    closeButton.textContent = 'Close';
    startButton.onclick = async () => {
        modal.removeChild(startButton);

        try {
            // 1. Request an immersive VR session (must be inside user gesture handler)
            const session = await navigator.xr.requestSession("immersive-vr");

            // 2. Attach session to renderer
            await renderer.xr.setSession(session);

            // 3. Optionally append the standard VRButton to allow exiting later
            document.body.appendChild(VRButton.createButton(renderer));

            // 4. (Optional) Resize renderer to full-window before session begins
            renderer.setSize(window.innerWidth, window.innerHeight);
        } catch (err) {
            console.error("Failed to start XR session:", err);
        }
    };

    modal.appendChild(closeButton);

    document.body.appendChild(modal);

    // Background
    const loader = new THREE.TextureLoader();
    const texture = loader.load('box.png');
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