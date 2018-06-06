import * as styledComponents from 'styled-components';

const {
    default: styled,
    css,
    injectGlobal,
    keyframes,
    ThemeProvider,
} = styledComponents as styledComponents.ThemedStyledComponentsModule<IThemeInterface>;

export interface IThemeInterface {}

export const theme = {};

export { styled, css, injectGlobal, keyframes, ThemeProvider };
