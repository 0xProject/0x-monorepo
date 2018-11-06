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

/// media helper
export interface MediaChoice {
    sm: string;
    md?: string;
    lg?: string;
}
// TODO: handle string too
export const stylesForMedia = (choice: MediaChoice): InterpolationValue[] => {
    return media.small`width: ${choice.sm}`;
};
