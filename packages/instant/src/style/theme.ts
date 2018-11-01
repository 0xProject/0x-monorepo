import * as styledComponents from 'styled-components';

const { default: styled, css, keyframes, ThemeProvider } = styledComponents;

export type Theme = { [key in ColorOption]: string };

export enum ColorOption {
    primaryColor = 'primaryColor',
    black = 'black',
    lightGrey = 'lightGrey',
    grey = 'grey',
    feintGrey = 'feintGrey',
    darkGrey = 'darkGrey',
    white = 'white',
    lightOrange = 'lightOrange',
    darkOrange = 'darkOrange',
}

export const theme: Theme = {
    primaryColor: '#512D80',
    black: 'black',
    lightGrey: '#999999',
    grey: '#666666',
    feintGrey: '#DEDEDE',
    darkGrey: '#333333',
    white: 'white',
    lightOrange: '#F9F2ED',
    darkOrange: '#F2994C',
};

export const transparentWhite = 'rgba(255,255,255,0.3)';
export const overlayBlack = 'rgba(0, 0, 0, 0.6)';

export { styled, css, keyframes, ThemeProvider };
