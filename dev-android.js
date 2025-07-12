// scripts/dev.js
import { config as loadEnv } from 'dotenv';
import concurrently from 'concurrently';

loadEnv();

const ANDROID_DEVICE = process.env.ANDROID_DEVICE;
if (!ANDROID_DEVICE) {
    console.error('✖ ANDROID_DEVICE not set in .env');
    process.exit(1);
}

concurrently(
    [
        { name: 'SERVE', command: 'serve'},
        { name: 'ROLLUP', command: 'rollup -c -w', prefixColor: 'yellow' },
        {
            name: 'WEBEXT',
            command: `web-ext run --target=firefox-android --android-device=${ANDROID_DEVICE} --firefox-apk org.mozilla.fenix`,
            prefixColor: 'cyan',
        },
    ],
    { killOthers: ['failure', 'success'] },
    (exitCodes, signal) => {
        if (exitCodes.some(code => code !== 0)) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    }
);
