import * as THREE from 'three';
import WebVRPolyfill from './vendor/webvr-polyfill.js'
import VREffect from './vendor/VREffect.js'
import VideoProgressBar from './VideoProgressBar.js';

var progressBar = null;
var effect = null;
var scene = null;
var camera = null;
var renderer = null;
var canvas = null;

function log(arg){
    console.log(`[VR Video Injector] ${arg}`)
}

function enterFullscreen (el) {
    log("Trying to fullscreen...")
    if (el.requestFullscreen) {
        el.requestFullscreen();
    } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen();
    } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
    }
}

var animID = null;

const style = document.createElement('style');
style.textContent = `
#vr-overlay-modal {
  position: fixed;
  z-index: 999999;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
#vr-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
}
#vr-start-button {
  position: absolute;
  z-index: 1000000;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  font-size: 16px;
  background-color: #00cc88;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
#vr-close-button {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000000;
  padding: 10px 20px;
  font-size: 14px;
  background-color: #cc3333;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
canvas.webgl {
  width: 100%;
  height: 100%;
  display: block;
}
`;
log("added style.")

document.head.appendChild(style);

var vrDisplay, controls;
var enableControls = false;

// Get the first video
const video = document.querySelector('video');


// ENTRY POINT
if (!video) {
    alert("No video element found on this page.");
}else{
    init();
}

function init(){
    video.setAttribute('muted', true);
    video.setAttribute('playsinline', true);
    video.setAttribute('autoplay', true);
    video.setAttribute('loop', true);
//video.style.display = 'none';
//video.play();
    log("Video attrs changed.")

// WebVR Polyfill config
    const config = window.VR_CONFIG;

    log("Adding polyfill");
    var polyfill = new WebVRPolyfill(config);
    console.log(polyfill);
    log("WebVRPolyfill instantiated.");

//--- create overlay
    const overlay = document.createElement('div');
    overlay.id = 'vr-overlay-modal';

    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'vr-canvas-container';

    const vrButton = document.createElement('button');
    vrButton.id = 'vr-start-button';
    vrButton.textContent = 'Enter VR';

    const closeButton = document.createElement('button');
    closeButton.id = 'vr-close-button';
    closeButton.textContent = 'Close this overlay';

    overlay.appendChild(vrButton);
    overlay.appendChild(closeButton);
    overlay.appendChild(canvasContainer);
    document.body.appendChild(overlay);

    vrButton.addEventListener('click', () => {
        log("entering VR")
        const canvas = renderer.domElement;

        //enterFullscreen(canvas)

        // The polyfill provides this in the event this browser
        // does not support WebVR 1.1
        navigator.getVRDisplays().then(function (vrDisplays) {
            log("getVRDisplays() start")
            // If we have a native display, or we have a CardboardVRDisplay
            // from the polyfill, use it
            if (vrDisplays.length) {
                vrDisplay = vrDisplays[0];

                // Apply VR headset positional data to camera.
                //controls = new THREE.VRControls(camera);

                // Kick off the render loop.
                log("starting render loop in VR mode")
                enterFullscreen(canvas)
                vrDisplay.requestPresent([{ source: renderer.domElement }]);
                animID = vrDisplay.requestAnimationFrame(animate);
            }
                // Otherwise, we're on a desktop environment with no native
            // displays, so provide controls for a monoscopic desktop view
            else {
                //controls = new THREE.OrbitControls(camera);
                //controls.target.set(0, 0, -1);

                // Disable the "Enter VR" button
                //vrDisplay = new CardboardVRDisplay(config);
                //var enterVRButton = document.querySelector('#vr');
                //enterVRButton.disabled = true;

                // Kick off the render loop.
                log("starting render loop in desktop mode")
                animID = requestAnimationFrame(animate);
            }
        });

        // Optional: hide button after VR starts
        vrButton.style.display = 'none';
    });

    closeButton.addEventListener('click', () => {
        log("leaving VR")
        // Exit WebVR presentation if active
        if (navigator.getVRDisplays) {
            navigator.getVRDisplays().then(displays => {
                if (displays.length && displays[0].isPresenting) {
                    displays[0].exitPresent();
                }
            });
        }

        // Exit fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }

        // Remove overlay
        document.body.removeChild(overlay);

        // Optionally restore video element appearance
        video.style.display = ''; // restore original styling

        // Optionally stop Three.js animation loop (if you stored a reference)
        if(animID)
            cancelAnimationFrame(animID);
    });
    log("overlay created.")
//--- end overlay

//--- init renderer
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.classList.add('webgl');

// Append the canvas inside the modal container
    document.getElementById('vr-canvas-container').appendChild(renderer.domElement);
    log(`Renderer element added to overlay: ${renderer.domElement}`);


    canvas = renderer.domElement;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    scene.add(camera);

    effect = new VREffect(renderer);
    console.log(effect);
    effect.setSize(canvas.clientWidth, canvas.clientHeight, false);

//const controls = new THREE.VRControls(camera);
    log(`VRController instantiated.`);

// Video

    video.pause()

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;
    const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });

    const videoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), videoMaterial);
    videoPlane.position.set(0, 0, -1.5);
    scene.add(videoPlane);

    log(video.readyState)

    video.play();

// Progress bar
    progressBar = new VideoProgressBar({
        videoElement: video,
        width: 1.6,
        height: 0.05,
        position: new THREE.Vector3(0, -0.6, -1.49),
        backgroundColor: 0x222222,
        fillColor: 0xff4444
    });
    scene.add(progressBar.bgBar);
    scene.add(progressBar.fillBar);

// Skybox
    const loader = new THREE.TextureLoader();
    loader.load('box.png', texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 5);
        const skybox = new THREE.Mesh(
            new THREE.BoxGeometry(5, 5, 5),
            new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
        );
        scene.add(skybox);
        log("Added skybox")
    });
}

// Request animation frame loop function
var lastRender = 0;
function animate(timestamp) {
    var delta = Math.min(timestamp - lastRender, 500);
    lastRender = timestamp;

    // Update VR headset position and apply to camera.
    if(enableControls)
        controls.update();

    progressBar.updateProgress();

    // Render the scene.
    effect.render(scene, camera);

    // Keep looping; if using a VRDisplay, call its requestAnimationFrame,
    // otherwise call window.requestAnimationFrame.
    if (vrDisplay) {
        animID = vrDisplay.requestAnimationFrame(animate);
    } else {
        animID = requestAnimationFrame(animate);
    }
}

function onResize() {
    // The delay ensures the browser has a chance to layout
    // the page and update the clientWidth/clientHeight.
    // This problem particularly crops up under iOS.
    if (!onResize.resizeDelay) {
        onResize.resizeDelay = setTimeout(function () {
            onResize.resizeDelay = null;
            log('Resizing to %s x %s.', canvas.clientWidth, canvas.clientHeight);
            effect.setSize(canvas.clientWidth, canvas.clientHeight, false);
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }, 250);
    }
}

function onVRDisplayPresentChange() {
    log('onVRDisplayPresentChange');
    onResize();
    //buttons.hidden = vrDisplay.isPresenting;
}

function onVRDisplayConnect(e) {
    log('onVRDisplayConnect', (e.display || (e.detail && e.detail.display)));
}

// Resize the WebGL canvas when we resize and also when we change modes.
window.addEventListener('resize', onResize);
window.addEventListener('vrdisplaypresentchange', onVRDisplayPresentChange);
window.addEventListener('vrdisplayconnect', onVRDisplayConnect);
