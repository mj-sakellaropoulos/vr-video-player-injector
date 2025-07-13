import { log, err } from './common/LogHelper.js';

// --- Chrome Promisified Wrappers ---

export function queryTabs(queryOptions) {
    return new Promise((resolve, reject) => {
        chrome.tabs.query(queryOptions, (tabs) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(tabs);
            }
        });
    });
}

export function executeScriptPromise(tabId, details) {
    return new Promise((resolve, reject) => {
        chrome.tabs.executeScript(tabId, details, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}

export function getStorageValue(key) {
    return new Promise((resolve, reject) => {
        //let timeout = setTimeout(() => {
        //    console.warn("chrome.storage.local.get callback never fired");
        //    reject(new Error("storage timeout"));
        //}, 2000);

        chrome.storage.local.get(key, (result) => {
            //clearTimeout(timeout);
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result[key]);
            }
        });
    });
}


// --- Helpers ---

export async function getCurrentTab() {
    try {
        const tabs = await queryTabs({ active: true, currentWindow: true });
        if (!tabs.length) {
            throw new Error('No active tab found');
        }
        log("Current tab found", "extHelper.js", tabs[0]);
        return tabs[0];
    } catch (e) {
        err("Could not find tab", "extHelper.js", e);
        throw e;
    }
}

export function utf8ToBase64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
    ));
}

export async function injectB64ScriptTagIntoTab(tab, B64, scriptName) {
    log(`Trying to inject ${scriptName}`, "injectB64ScriptTagIntoTab");

    const code = `
    (function() {
      console.log("[VR Video Injector / chrome.tabs.executeScript] Injecting ${scriptName}");
      const s = document.createElement('script');
      s.src = "data:text/javascript;base64,${B64}";
      (document.head || document.documentElement).appendChild(s);
    })();
  `;

    try {
        await executeScriptPromise(tab.id, { code, runAt: 'document_idle' });
        log(`Injected ${scriptName} successfully`, "injectB64ScriptTagIntoTab");
    } catch (e) {
        err(`Failed to inject ${scriptName}`, "injectB64ScriptTagIntoTab", e.message);
    }
}

export async function injectConfiguration(tab, type) {
    const cfg_key = type === 'webxr' ? 'webxr_conf' : 'webvr_conf';
    log("Injecting configuration...", "injectConfiguration", cfg_key);

    try {
        console.log("chrome.storage.local available?", typeof chrome.storage?.local);
        const config = await getStorageValue(cfg_key);
        log("storage result:", "injectConfiguration", config);

        const configJson = JSON.stringify(config || {});
        const base64 = utf8ToBase64(`window.VR_CONFIG = ${configJson};`);

        log("Found configuration. injecting into page...", "injectConfiguration");
        await injectB64ScriptTagIntoTab(tab, base64, cfg_key);
    } catch (e) {
        err("Failed to inject configuration", "injectConfiguration", e.message);
    }
}

export async function injectPlugin(msg) {
    const B64 = msg.type === 'webxr' ? WEBXR_B64 :
        msg.type === 'webvr' ? WEBVR_B64 : null;
    if (!B64) return;

    try {
        log("Injecting: ", "injectPlugin", msg);
        const tab = await getCurrentTab();
        log("Got tab: ", "injectPlugin", tab)
        try {
            await injectConfiguration(tab, msg.type);
        } catch (e) {
            err("injectConfiguration() failed", "injectPlugin", e.message);
        }
        try {
            await injectB64ScriptTagIntoTab(tab, B64, `main script: ${msg.type}`);
        } catch (e) {
            err("injectB64ScriptTagIntoTab() failed", "injectPlugin", e.message);
        }
    } catch (e) {
        err("Failed to inject plugin", "injectPlugin", e.message);
    }
}
