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
