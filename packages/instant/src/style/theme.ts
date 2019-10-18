import * as styledComponents from 'styled-components';

const {
    default: styled,
    css,
    keyframes,
    withTheme,
    createGlobalStyle,
    ThemeConsumer,
    ThemeProvider,
} = styledComponents;

export type Theme = { [key in ColorOption]: string };
// tslint:disable:enum-naming
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
    darkBlue = 'darkBlue',
    lightBlue = 'lightBlue',
    whiteBackground = 'whiteBackground',
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
    lightOrange: '#FFF8F2',
    darkOrange: '#F7A24F',
    green: '#3CB34F',
    red: '#D00000',
    darkBlue: '#135df6',
    lightBlue: '#F2F7FF',
    whiteBackground: '#FFFFFF',
};

export const transparentWhite = 'rgba(255,255,255,0.3)';
export const completelyTransparent = 'rga(0, 0, 0, 0)';

export const generateOverlayBlack = (opacity = 0.6) => {
    return `rgba(0, 0, 0, ${opacity})`;
};

export { styled, css, keyframes, withTheme, createGlobalStyle, ThemeConsumer, ThemeProvider };
