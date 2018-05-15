import { promisify } from '@0xproject/utils';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';

export const fsWrapper = {
    readdirAsync: promisify<string[]>(fs.readdir),
    readFileAsync: promisify<string>(fs.readFile),
    writeFileAsync: promisify<undefined>(fs.writeFile),
    mkdirpAsync: promisify<undefined>(mkdirp),
    doesPathExistSync: fs.existsSync,
    rmdirSync: fs.rmdirSync,
    removeFileAsync: promisify<undefined>(fs.unlink),
};
