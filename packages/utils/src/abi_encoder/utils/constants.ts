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
    DEFAULT_DECODING_RULES: { shouldConvertStructsToObjects: true } as DecodingRules,
    DEFAULT_ENCODING_RULES: { shouldOptimize: true, shouldAnnotate: false } as EncodingRules,
    /* tslint:enable no-object-literal-type-assertion */
};
