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

export interface ScreenSpecification<T> {
    default: T;
    sm?: T;
    md?: T;
    lg?: T;
}
export type OptionallyScreenSpecific<T> = T | ScreenSpecification<T>;
export type MediaChoice = OptionallyScreenSpecific<string>;
/**
 * Given a css property name and a OptionallyScreenSpecific value,
 * generates css properties with screen-specific viewport styling
 */
export function stylesForMedia<T extends string | number>(
    cssPropertyName: string,
    choice: OptionallyScreenSpecific<T>,
): InterpolationValue[] {
    if (typeof choice === 'object') {
        return css`
        ${cssPropertyName}: ${choice.default};
        ${choice.lg && media.large`${cssPropertyName}: ${choice.lg}`}
        ${choice.md && media.medium`${cssPropertyName}: ${choice.md}`}
        ${choice.sm && media.small`${cssPropertyName}: ${choice.sm}`}
    `;
    } else {
        return css`
            ${cssPropertyName}: ${choice};
        `;
    }
}
