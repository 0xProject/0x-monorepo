import { promisify } from '@0x/utils';
import { SubResolver } from '@resolver-engine/core';
import * as fs from 'fs';
import * as path from 'path';

import glob = require('glob');

const globAsync = promisify<string[]>(glob);

const SOLIDITY_FILE_EXTENSION = '.sol';

export function NameResolver(contractDir: string): SubResolver {
    return async (resolvePath: string) => {
        const results = await globAsync(contractDir + '/**/' + resolvePath + SOLIDITY_FILE_EXTENSION);
        if (results.length === 1) {
            return results[0];
        }
        return null;
    };
}
