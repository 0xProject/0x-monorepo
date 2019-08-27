import Icon from 'ts/icons/logos/compiler.svg';

import { ContextInterface } from './index';

export const context: ContextInterface = {
    title: 'sol-compiler',
    name: 'compiler',
    docLink: 'https://0x.org/docs/tools/sol-compiler',
    subtitle: 'Solidity compilation that just works',
    tagline: 'Seamlessly compile an entire solidity project and generate customisable artifacts',
    icon: Icon,
    colors: {
        main: '#1EADCD',
        secondary: '#D1F4FC',
        secondary_alt: '#C4F2FC',
        type: '#30C3E3',
        type_alt: '#16A9C9',
        dark: '#4B818D',
    },
};
