import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-import-css';
import { Buffer } from 'node:buffer';

function injectorBundle(name, input, store) {
    return {
        input,
        output: {
            dir: 'extension/tmp', // output needed for Rollup internals, won’t be kept
            format: 'iife',
            name: `${name}_bundle`
        },
        plugins: [
            css(),
            resolve(),
            commonjs(),
            {
                name: 'collect-base64-' + name,
                generateBundle(_, bundle) {
                    const chunk = Object.values(bundle).find(f => f.isEntry);
                    const b64 = Buffer.from(chunk.code).toString('base64');
                    store[name.toUpperCase() + '_B64'] = b64;
                    delete bundle[chunk.fileName];
                }
            }
        ]
    };
}

function backgroundBundle(store) {
    return {
        name: 'generate-background-script',
        generateBundle() {
            const bgScript = `
const WEBXR_B64 = '${store.WEBXR_B64}';
const WEBVR_B64 = '${store.WEBVR_B64}';

chrome.runtime.onMessage.addListener((msg) => {
  const B64 = msg.type === 'webxr' ? WEBXR_B64 :
              msg.type === 'webvr' ? WEBVR_B64 : null;
  if (!B64) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) return;
    const code = \`(function() {
      const s = document.createElement('script');
      s.src = "data:text/javascript;base64,\${B64}";
      (document.head || document.documentElement).appendChild(s);
    })();\`;
    chrome.tabs.executeScript(tab.id, { code, runAt: 'document_idle' });
  });
});
      `.trim();

            this.emitFile({
                type: 'asset',
                fileName: 'background_script.js',
                source: bgScript
            });
        }
    };
}

const b64Store = {};

export default [
    injectorBundle('webxr', 'src/webxr/inject.js', b64Store),
    injectorBundle('webvr', 'src/webvr/inject.js', b64Store),
    {
        input: 'noop.js', // dummy file (must exist but won't be emitted)
        output: {
            dir: 'extension',
            format: 'iife'
        },
        plugins: [
            backgroundBundle(b64Store)
        ]
    }
];
