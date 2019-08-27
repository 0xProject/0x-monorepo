import Icon from 'ts/icons/logos/cov.svg';

import { ContextInterface } from './index';

export const context: ContextInterface = {
    title: 'sol-coverage',
    name: 'coverage',
    subtitle: 'Solidity code coverage',
    docLink: 'https://0x.org/docs/tools/sol-coverage',
    tagline: 'Measure Solidity code coverage',
    icon: Icon,
    colors: {
        main: '#BB9200',
        secondary: '#F1DB8D',
        secondary_alt: '#F1D882',
        type: '#D7AE1B',
        type_alt: '#BD9406',
        dark: '#817033',
    },
};
