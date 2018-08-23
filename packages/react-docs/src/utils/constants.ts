import { SupportedDocJson } from '../types';

export const constants = {
    TYPES_SECTION_NAME: 'types',
    EXTERNAL_EXPORTS_SECTION_NAME: 'external exports',
    TYPE_TO_SYNTAX: {
        [SupportedDocJson.Doxity]: 'solidity',
        [SupportedDocJson.TypeDoc]: 'typescript',
    } as { [supportedDocType: string]: string },
};
