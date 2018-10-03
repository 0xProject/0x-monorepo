import * as styledComponents from 'styled-components';

const {
    default: styled,
    css,
    injectGlobal,
    keyframes,
    ThemeProvider,
} = styledComponents as styledComponents.ThemedStyledComponentsModule<IThemeInterface>;

export interface IThemeInterface {
    primaryColor: string;
    black: string;
    white: string;
    darkGrey: string;
    lightGrey: string;
}

export const theme: IThemeInterface = {
    primaryColor: '#512D80',
    black: 'black',
    lightGrey: '#999999',
    darkGrey: '#333333',
    white: 'white',
};

export { styled, css, injectGlobal, keyframes, ThemeProvider };
