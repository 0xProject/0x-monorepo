import { DecodingRules, EncodingRules } from './rules';

export const EVM_WORD_WIDTH_IN_BYTES = 32;
export const EVM_WORD_WIDTH_IN_BITS = 256;
export const HEX_BASE = 16;
export const DEC_BASE = 10;
export const BIN_BASE = 2;
export const HEX_SELECTOR_LENGTH_IN_CHARS = 10;
export const HEX_SELECTOR_LENGTH_IN_BYTES = 4;
export const HEX_SELECTOR_BYTE_OFFSET_IN_CALLDATA = 0;
export const DEFAULT_DECODING_RULES: DecodingRules = { structsAsObjects: false };
export const DEFAULT_ENCODING_RULES: EncodingRules = { optimize: false, annotate: false };
