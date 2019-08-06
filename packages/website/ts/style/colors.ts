import { colors as sharedColors } from 'ts/utils/colors';

const appColors = {
    walletBoxShadow: 'rgba(0, 0, 0, 0.05)',
    walletBorder: '#ededee',
    walletDefaultItemBackground: '#fbfbfc',
    walletFocusedItemBackground: '#f0f1f4',
    allowanceToggleShadow: 'rgba(0, 0, 0, 0)',
    wrapEtherConfirmationButton: sharedColors.mediumBlue,
    drawerMenuBackground: '#4a4a4a',
    menuItemDefaultSelectedBackground: '#424242',
    jobsPageBackground: sharedColors.grey50,
    jobsPageOpenPositionRow: sharedColors.grey100,
    metaMaskOrange: '#f68c24',
    metaMaskTransparentOrange: 'rgba(255, 248, 242, 0.8)',
    brandLight: '#00AE99',
    brandDark: '#003831',
    backgroundDark: '#111A19',
    backgroundBlack: '#000000',
    backgroundLight: '#F3F6F4',
    backgroundLightHover: '#EAEFEC',
    textDarkPrimary: '#000000',
    textDarkSecondary: '#5C5C5C',
    white: '#fff',
    instantPrimaryBackground: '#222222',
    instantSecondaryBackground: '#333333',
    instantTertiaryBackground: '#444444',
};

export const colors = {
    ...sharedColors,
    ...appColors,
};
