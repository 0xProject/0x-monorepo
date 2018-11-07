import { InterpolationValue } from 'styled-components';

import { css } from './theme';

export enum ScreenWidths {
    Sm = 40,
    Md = 52,
    Lg = 64,
}

const generateMediaWrapper = (screenWidth: ScreenWidths) => (...args: any[]) => css`
    @media (max-width: ${screenWidth}em) {
        ${css.apply(css, args)};
    }
`;

export const media = {
    small: generateMediaWrapper(ScreenWidths.Sm),
    medium: generateMediaWrapper(ScreenWidths.Md),
    large: generateMediaWrapper(ScreenWidths.Lg),
};

export interface ScreenSpecifications {
    default: string;
    sm?: string;
    md?: string;
    lg?: string;
}
export type MediaChoice = string | ScreenSpecifications;
export const stylesForMedia = (cssPropertyName: string, choice: MediaChoice): InterpolationValue[] => {
    if (typeof choice === 'string') {
        return css`
            ${cssPropertyName}: ${choice};
        `;
    }

    return css`
        ${cssPropertyName}: ${choice.default};
        ${choice.lg && media.large`${cssPropertyName}: ${choice.lg}`}
        ${choice.md && media.medium`${cssPropertyName}: ${choice.md}`}
        ${choice.sm && media.small`${cssPropertyName}: ${choice.sm}`}
    `;
};
