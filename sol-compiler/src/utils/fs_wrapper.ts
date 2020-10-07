import { promisify } from '@0x/utils';
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
    statAsync: promisify<fs.Stats>(fs.stat),
    appendFileAsync: promisify<undefined>(fs.appendFile),
    accessAsync: promisify<boolean>(fs.access),
    doesFileExistAsync: async (filePath: string): Promise<boolean> => {
        try {
            await fsWrapper.accessAsync(
                filePath,
                // node says we need to use bitwise, but tslint says no:
                fs.constants.F_OK | fs.constants.R_OK, // tslint:disable-line:no-bitwise
            );
        } catch (err) {
            return false;
        }
        return true;
    },
};
