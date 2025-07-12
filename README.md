# WIP - WebXR Video Player webext

## Build and run

`npm run build`

1. disable xpi signing
2. install temporary addon

## Dev setup

### FF Desktop

`npm run desktop`

### FF Android
`echo "ANDROID_DEVICE=$(adb devices | tail -n +2 | awk '{print $1; exit}')" >> .env`
`npm run android`