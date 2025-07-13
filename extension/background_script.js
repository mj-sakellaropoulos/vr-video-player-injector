(function () {
    'use strict';

    console.log("[VR Video Injector] background script loaded");

    const VR_DEFAULT = {
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
                    -9904169e-10, 6.183535E-5, -16981803e-13]
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
        BUFFER_SCALE: 1.0,
        DIRTY_SUBMIT_FRAME_BINDINGS: false,
    };


    const XR_DEFAULT = {
        //global: window, //not serializable
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
                        -9904169e-10, 6.183535E-5, -16981803e-13]
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
    };

    // Store both configs if not already defined
    chrome.runtime.onInstalled.addListener(() => {
        chrome.storage.local.get(['webxr_conf', 'webvr_conf'], (res) => {
            const updates = {};
            if (!res.webxr_conf || Object.keys(res.webxr_conf).length === 0) {
                updates.webxr_conf = XR_DEFAULT;
            }
            if (!res.webvr_conf || Object.keys(res.webvr_conf).length === 0) {
                updates.webvr_conf = VR_DEFAULT;
            }

            if (Object.keys(updates).length > 0) {
                chrome.storage.local.set(updates, () => {
                    console.log("[VR Video Injector] Default config saved to storage:", updates);
                });
            } else {
                console.log("[VR Video Injector] Config already exists in storage, skipping default set.");
            }
        });
    });

})();
