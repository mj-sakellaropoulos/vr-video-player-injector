import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';


export default [
    {
        watch: true,
        input: './src/VideoPlayerInjector.js',
        output: {
            file: './extension/content_script.js',
            format: 'iife', // suitable for browser
            name: 'VRVideoPlayerInjector' // global var for the IIFE
        },
        plugins: [
            resolve(),    // locate and bundle node_modules
            commonjs(),    // convert CommonJS to ES6 if needed
            terser()
        ]
    }
]
;
