import * as ethUtil from 'ethereumjs-util';

import { DecodingRules, EncodingRules } from './rules';

export const constants = {
    EVM_WORD_WIDTH_IN_BYTES: 32,
    EVM_WORD_WIDTH_IN_BITS: 256,
    HEX_BASE: 16,
    DEC_BASE: 10,
    BIN_BASE: 2,
    HEX_SELECTOR_LENGTH_IN_CHARS: 10,
    HEX_SELECTOR_LENGTH_IN_BYTES: 4,
    HEX_SELECTOR_BYTE_OFFSET_IN_CALLDATA: 0,
    // Disable no-object-literal-type-assertion so we can enforce cast
    /* tslint:disable no-object-literal-type-assertion */
    DEFAULT_DECODING_RULES: { shouldConvertStructsToObjects: true, isStrictMode: false } as DecodingRules,
    DEFAULT_ENCODING_RULES: { shouldOptimize: true, shouldAnnotate: false } as EncodingRules,
    /* tslint:enable no-object-literal-type-assertion */
    EMPTY_EVM_WORD_STRING: '0x0000000000000000000000000000000000000000000000000000000000000000',
    EMPTY_EVM_WORD_BUFFER: ethUtil.toBuffer('0x0000000000000000000000000000000000000000000000000000000000000000'),
    NUMBER_OF_BYTES_IN_UINT8: 8,
    NUMBER_OF_BYTES_IN_INT8: 8,
};
