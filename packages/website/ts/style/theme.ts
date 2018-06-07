import * as styledComponents from 'styled-components';

// tslint:disable:no-unnecessary-type-assertion
const {
    default: styled,
    css,
    injectGlobal,
    keyframes,
    ThemeProvider,
} = styledComponents as styledComponents.ThemedStyledComponentsModule<IThemeInterface>;
// tslint:enable:no-unnecessary-type-assertion

export interface IThemeInterface {}

export const theme = {};

export { styled, css, injectGlobal, keyframes, ThemeProvider };
