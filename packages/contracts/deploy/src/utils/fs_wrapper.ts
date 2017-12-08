import {promisify} from '@0xproject/utils';
import * as fs from 'fs';

export const fsWrapper = {
    readdirAsync: promisify<string[]>(fs.readdir),
    readFileAsync: promisify<string>(fs.readFile),
    writeFileAsync: promisify<undefined>(fs.writeFile),
    mkdirAsync: promisify<undefined>(fs.mkdir),
    doesPathExistSync: fs.existsSync,
    removeFileAsync: promisify<undefined>(fs.unlink),
};
