import { SupportedDocJson } from '../types';

export const constants = {
    TYPES_SECTION_NAME: 'types',
    TYPE_TO_SYNTAX: {
        [SupportedDocJson.Doxity]: 'solidity',
        [SupportedDocJson.TypeDoc]: 'typescript',
    } as { [supportedDocType: string]: string },
};
