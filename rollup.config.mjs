import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-import-css';
import { Buffer } from 'node:buffer';
import fs from 'fs';

function buildInjector({ name, input }) {
    return {
        input,
        output: {
            file: `extension/__tmp__${name}.js`,
            format: 'iife',
            name: `${name}_bundle`
        },
        plugins: [
            css(),
            resolve(),
            commonjs(),
            {
                name: 'bundle-base64-' + name,
                generateBundle(_, bundle) {
                    const chunk = Object.values(bundle).find(f => f.isEntry);
                    const b64 = Buffer.from(chunk.code).toString('base64');
                    this.emitFile({
                        type: 'asset',
                        fileName: `__b64__${name}.js`,
                        source: `export const ${name.toUpperCase()}_B64 = '${b64}';`
                    });
                    delete bundle[chunk.fileName];
                }
            }
        ]
    };
}

// --- Generate background_script.js with both B64 vars ---
function buildBackgroundScript() {
    return {
        name: 'generate-background-script',
        buildStart() {
            this.addWatchFile('extension/__b64__webxr.js');
            this.addWatchFile('extension/__b64__webvr.js');
        },
        generateBundle() {
            const webxrB64 = fs.readFileSync('extension/__b64__webxr.js', 'utf-8')
                .match(/'([^']+)'/)[1];
            const webvrB64 = fs.readFileSync('extension/__b64__webvr.js', 'utf-8')
                .match(/'([^']+)'/)[1];

            const background = `
const WEBXR_B64 = '${webxrB64}';
const WEBVR_B64 = '${webvrB64}';

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
`;

            this.emitFile({
                type: 'asset',
                fileName: 'background_script.js',
                source: background.trim()
            });
        }
    };
}

export default [
    buildInjector({ name: 'webxr', input: 'src/webxr/inject.js' }),
    buildInjector({ name: 'webvr', input: 'src/webvr/inject.js' }),
    {
        input: 'noop.js', // can be any empty placeholder
        output: {
            dir: 'extension',
            format: 'iife'
        },
        plugins: [buildBackgroundScript()]
    }
];
