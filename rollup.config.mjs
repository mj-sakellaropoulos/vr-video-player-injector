import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-import-css';
import { Buffer } from 'node:buffer';

/**
 * Creates a Rollup configuration object for a given injector script (WebXR or WebVR).
 * The output is compiled to an IIFE, base64-encoded, and stored in the provided object.
 *
 * @param {string} name - The name of the injector (e.g., "webxr" or "webvr").
 * @param {string} input - The path to the injector's entry file.
 * @param {object} store - An object that receives a base64-encoded version of the compiled code.
 * @returns {object} Rollup configuration for the injector bundle.
 */
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

/**
 * A Rollup plugin that injects base64-encoded WebXR and WebVR bundles into the top of the background script.
 * This enables dynamic injection of the scripts into pages at runtime without requiring external files.
 *
 * @param {object} store - An object containing WEBXR_B64 and WEBVR_B64 strings from injectorBundle().
 * @returns {object} A Rollup plugin that modifies the generated background script.
 */
function InjectB64ConstantsIntoChunkHeader(store) {
    return {
        name: 'inject-b64-constants',
        async generateBundle(options, bundle) {
            const entryChunk = Object.values(bundle).find(f => f.isEntry);

            if (!entryChunk) throw new Error('No entry chunk found for background_script');

            const injectedHeader = `
const WEBXR_B64 = '${store.WEBXR_B64}';
const WEBVR_B64 = '${store.WEBVR_B64}';
`.trim();

            // Prepend the header to the existing background code
            entryChunk.code = `${injectedHeader}\n\n${entryChunk.code}`;
        }
    };
}


const b64Store = {};

export default [
    // Bundle WebXR and WebVR Injection scripts as Base64
    injectorBundle('webxr', 'src/webxr/inject.js', b64Store),
    injectorBundle('webvr', 'src/webvr/inject.js', b64Store),
    // Bundle the background_script, whcih contains injection logic.
    {
        input: 'src/extension/browserAction/browserAction.js',
        output: {
            file: 'extension/browserAction/browserAction.js',
            format: 'iife',
            name: 'browserActionScript',
        },
        plugins: [
            resolve(),
            commonjs(),
            //Uses our plugin to insert the Base64 scripts at the start of the emitted code.
            InjectB64ConstantsIntoChunkHeader(b64Store)
        ]
    },
    {
        input: 'src/extension/options/options.js',
        output: {
            file: 'extension/options/options.js',
            format: 'iife',
            name: 'optionsScript',
        },
        plugins: [
            resolve(),
            commonjs(),
        ]
    },
    {
        input: 'src/extension/background_script.js',
        output: {
            file: 'extension/background_script.js',
            format: 'iife',
            name: 'backgroundScript',
        },
        plugins: [
            resolve(),
            commonjs(),
        ]
    }
];
