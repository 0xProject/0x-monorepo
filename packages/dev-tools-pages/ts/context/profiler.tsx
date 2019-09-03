import Icon from 'ts/icons/logos/profiler.svg';

import { ContextInterface } from './index';

export const context: ContextInterface = {
    title: 'sol-profiler',
    name: 'profiler',
    docLink: 'https://0x.org/docs/tools/sol-profiler',
    subtitle: 'Gas profiling for Solidity',
    tagline: "Implement data-guided optimizations by profiling your contract's gas usage",
    icon: Icon,
    colors: {
        main: '#FF7144',
        secondary: '#FED7CB',
        secondary_alt: '#FECEBE',
        type: '#EB8666',
        type_alt: '#D16745',
        dark: '#985C49',
    },
};
