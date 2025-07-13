const vrArea = document.getElementById('webvr');
const xrArea = document.getElementById('webxr');
const saveBtn = document.getElementById('save');

// Load saved config on open
chrome.storage.local.get(['webvr_conf','webxr_conf'], (res) => {
    vrArea.value = JSON.stringify(res.webvr_conf || {}, null, 2);
    xrArea.value = JSON.stringify(res.webxr_conf || {}, null, 2);
});

// Save on click
saveBtn.addEventListener('click', () => {
    let data = {};
    try {
        data.webvr_conf = JSON.parse(vrArea.value);
        data.webxr_conf = JSON.parse(xrArea.value);
        chrome.storage.local.set(data, () => alert('Saved!'));
    } catch (e) {
        alert('Invalid JSON: ' + e);
    }
});
