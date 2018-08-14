import { css } from 'ts/style/theme';
import { ScreenWidths } from 'ts/types';

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
