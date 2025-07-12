# WIP - VR Video Player Injector WebExtension

Injects either WebVR-polyfill or WebXR-polyfill and a THREE.js scene with a video texture into the current tab.

## Build and run

`npm run build`

## Chrome

Load unpacked extension --> `./extension`

## Firefox

1. disable xpi signing
2. install temporary addon

## Dev setup

### FF Desktop

`npm run desktop`

### FF Android

`echo "ANDROID_DEVICE=$(adb devices | tail -n +2 | awk '{print $1; exit}')" >> .env`

`npm run android`