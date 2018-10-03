import * as styledComponents from 'styled-components';

const {
    default: styled,
    css,
    injectGlobal,
    keyframes,
    ThemeProvider,
} = styledComponents as styledComponents.ThemedStyledComponentsModule<IThemeInterface>;

// Inject the inter-ui font into the page
styledComponents.injectGlobal`
    @import url('https://rsms.me/inter/inter-ui.css');
`;

export interface IThemeInterface {
    primaryColor: string;
    black: string;
    white: string;
    darkGrey: string;
    lightGrey: string;
    fontFamily: string;
}

export const theme: IThemeInterface = {
    primaryColor: '#512D80',
    black: 'black',
    lightGrey: '#999999',
    darkGrey: '#333333',
    white: 'white',
    fontFamily: 'Inter UI, sans-serif',
};

export { styled, css, injectGlobal, keyframes, ThemeProvider };
