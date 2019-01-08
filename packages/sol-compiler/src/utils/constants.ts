import * as path from 'path';

export const constants = {
    SOLIDITY_FILE_EXTENSION: '.sol',
    BASE_COMPILER_URL: 'https://ethereum.github.io/solc-bin/bin/',
    LATEST_ARTIFACT_VERSION: '2.0.0',
    SOLC_BIN_DIR: path.join(__dirname, '..', '..', 'solc_bin'),
};
