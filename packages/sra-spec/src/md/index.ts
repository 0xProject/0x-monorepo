import { readFileSync } from 'fs';

console.log('DIR', __dirname);

export const md = {
    introduction: readFileSync('lib/md/introduction.md').toString(),
};
