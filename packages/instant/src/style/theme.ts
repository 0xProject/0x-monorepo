import * as styledComponents from 'styled-components';

const { default: styled, css, keyframes, withTheme, createGlobalStyle, ThemeProvider } = styledComponents;

export type Theme = { [key in ColorOption]: string };

export enum ColorOption {
    primaryColor = 'primaryColor',
    black = 'black',
    lightGrey = 'lightGrey',
    grey = 'grey',
    feintGrey = 'feintGrey',
    lightestGrey = 'lightestGrey',
    darkGrey = 'darkGrey',
    white = 'white',
    lightOrange = 'lightOrange',
    darkOrange = 'darkOrange',
    green = 'green',
    red = 'red',
}

export const theme: Theme = {
    primaryColor: '#333',
    black: 'black',
    lightGrey: '#999999',
    grey: '#666666',
    feintGrey: '#DEDEDE',
    lightestGrey: '#EEEEEE',
    darkGrey: '#333333',
    white: 'white',
    lightOrange: '#F9F2ED',
    darkOrange: '#F2994C',
    green: '#3CB34F',
    red: '#D00000',
};

export const transparentWhite = 'rgba(255,255,255,0.3)';
export const overlayBlack = 'rgba(0, 0, 0, 0.6)';
export const completelyTransparent = 'rga(0, 0, 0, 0)';

export { styled, css, keyframes, withTheme, createGlobalStyle, ThemeProvider };
