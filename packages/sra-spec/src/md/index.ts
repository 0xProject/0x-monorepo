import { readFileSync } from 'fs';

export const md = {
    introduction: readFileSync(`${__dirname}/introduction.md`).toString(),
};
