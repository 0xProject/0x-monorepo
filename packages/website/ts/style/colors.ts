import { colors as sharedColors } from '@0x/react-shared';

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
};

export const colors = {
    ...sharedColors,
    ...appColors,
};
