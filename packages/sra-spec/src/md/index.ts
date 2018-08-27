import { readFileSync } from 'fs';

export const md = {
    introduction: readFileSync('introduction.md').toString(),
};
