document.getElementById('btn-webxr').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'webxr' });
    console.log("sent message webxr")
    window.close();
});

document.getElementById('btn-webvr').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'webvr' });
    console.log("sent message webvr")
    window.close();
});
