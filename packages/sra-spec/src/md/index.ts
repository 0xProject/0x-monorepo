import { readFileSync } from 'fs';

export const md = {
    introduction: readFileSync('lib/md/introduction.md').toString(),
};
