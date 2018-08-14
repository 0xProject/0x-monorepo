import { readFileSync } from 'fs';

export const md = {
    introduction: readFileSync('src/md/introduction.md').toString(),
};
