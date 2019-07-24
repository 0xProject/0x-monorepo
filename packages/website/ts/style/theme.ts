import * as styledComponents from 'styled-components';

import { colors } from 'ts/style/colors';

export interface IThemeValuesInterface {
    bgColor: string;
    darkBgColor?: string;
    lightBgColor: string;
    introTextColor: string;
    textColor: string;
    paragraphColor: string;
    linkColor: string;
    mobileNavBgUpper: string;
    mobileNavBgLower: string;
    mobileNavColor: string;
    dropdownBg: string;
    dropdownButtonBg: string;
    dropdownBorderColor?: string;
    dropdownColor: string;
    headerButtonBg: string;
    footerBg: string;
    footerColor: string;
}

export interface IThemeInterface {
    [key: string]: IThemeValuesInterface;
}

// tslint:disable:no-unnecessary-type-assertion
const {
    default: styled,
    css,
    createGlobalStyle,
    keyframes,
    ThemeProvider,
} = styledComponents as styledComponents.ThemedStyledComponentsModule<IThemeInterface>;
// tslint:enable:no-unnecessary-type-assertion

export { styled, css, createGlobalStyle, keyframes, ThemeProvider };

export const GLOBAL_THEMES: IThemeInterface = {
    dark: {
        bgColor: '#000000',
        darkBgColor: '#111A19',
        lightBgColor: '#003831',
        introTextColor: 'rgba(255, 255, 255, 0.75)',
        textColor: '#FFFFFF',
        paragraphColor: '#FFFFFF',
        linkColor: colors.brandLight,
        mobileNavBgUpper: '#003831',
        mobileNavBgLower: '#022924',
        mobileNavColor: '#FFFFFF',
        dropdownBg: '#111A19',
        dropdownButtonBg: '#003831',
        dropdownColor: '#FFFFFF',
        headerButtonBg: '#00AE99',
        footerBg: '#181818',
        footerColor: '#FFFFFF',
    },
    light: {
        bgColor: '#FFFFFF',
        lightBgColor: '#F3F6F4',
        darkBgColor: '#003831',
        introTextColor: 'rgba(92, 92, 92, 0.87)',
        textColor: '#000000',
        paragraphColor: '#474747',
        linkColor: colors.brandDark,
        mobileNavBgUpper: '#FFFFFF',
        mobileNavBgLower: '#F3F6F4',
        mobileNavColor: '#000000',
        dropdownBg: '#FBFBFB',
        dropdownButtonBg: '#F3F6F4',
        dropdownColor: '#003831',
        dropdownBorderColor: '#E4E4E4',
        headerButtonBg: '#003831',
        footerBg: '#F2F2F2',
        footerColor: '#000000',
    },
    gray: {
        bgColor: '#e0e0e0',
        lightBgColor: '#003831',
        introTextColor: 'rgba(92, 92, 92, 0.87)',
        textColor: '#000000',
        paragraphColor: '#777777',
        linkColor: colors.brandDark,
        mobileNavBgUpper: '#FFFFFF',
        mobileNavBgLower: '#F3F6F4',
        mobileNavColor: '#000000',
        dropdownBg: '#FFFFFF',
        dropdownButtonBg: '#F3F6F4',
        dropdownColor: '#003831',
        headerButtonBg: '#003831',
        footerBg: '#181818',
        footerColor: '#FFFFFF',
    },
};
