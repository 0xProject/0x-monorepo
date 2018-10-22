import { css } from 'styled-components';

const colors = {
    black: '#000000',
    white: '#FFFFFF',
    lightGray: '#F1F4F5',
    gray: '#F1F2F7',
    darkGray: '#E9ECED',
    blueGray: '#ECEFF9',
};

interface SizesInterface {
    [key: string]: number;
}

const sizes: SizesInterface = {
    large: 992,
    medium: 768,
    small: 376,
};

const media = Object.keys(sizes).reduce((acc: any, label: string) => {
    acc[label] = (args: any) => css`
        @media (max-width: ${sizes[label] / 16}em) {
            ${css(args)};
        }
    `;

    return acc;
}, {});

export default media;
export { colors, media };
