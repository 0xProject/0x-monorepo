import Icon from 'ts/icons/logos/trace.svg';

import { ContextInterface } from './index';

export const context: ContextInterface = {
    title: 'sol-trace',
    name: 'trace',
    subtitle: 'Human-readable stack traces',
    docLink: 'https://0x.org/docs/tools/sol-trace',
    tagline: 'Immediately locate Solidity errors and rapidly debug failed transactions',
    icon: Icon,
    colors: {
        main: '#4F76FF',
        secondary: '#CDD8FF',
        secondary_alt: '#BFCDFF',
        type: '#7090FF',
        type_alt: '#355CE5',
        dark: '#2A4ABC',
    },
};
