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
export interface ScreenSpecifications {
    default: string;
    sm?: string;
    md?: string;
    lg?: string;
}
export type MediaChoice = string | ScreenSpecifications;
// TODO: handle string too
export const stylesForMedia = (choice: MediaChoice): InterpolationValue[] => {
    let res: InterpolationValue[];
    if (typeof choice === 'string') {
        res = css`
            width: ${choice};
        `;
    } else {
        res = css`
            width: ${choice.default};
            ${choice.lg && media.large`width: ${choice.lg}`}
            ${choice.md && media.medium`width: ${choice.md}`}
            ${choice.sm && media.small`width: ${choice.sm}`}
        `;
    }

    console.log(res.toString());
    return res;
};
