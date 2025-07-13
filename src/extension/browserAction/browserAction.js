import {getCurrentTab, injectPlugin, getStorageValue} from "../../VRInjector.js";
import {log,err} from "../../common/LogHelper.js";

document.getElementById('btn-webxr').addEventListener('click', async () => {
    log("Injecting WebXR", "browserAction")
    await injectPlugin({type: 'webxr'})
    window.close();
});

document.getElementById('btn-webvr').addEventListener('click', async () => {
    log("Injecting WebVR", "browserAction")
    await injectPlugin({type: 'webvr'})
    window.close();
});
