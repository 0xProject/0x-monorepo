import { colors as sharedColors } from '@0xproject/react-shared';

const appColors = {
    walletBoxShadow: 'rgba(0, 0, 0, 0.05)',
    walletBorder: '#ededee',
    walletDefaultItemBackground: '#fbfbfc',
    walletFocusedItemBackground: '#f0f1f4',
    allowanceToggleShadow: 'rgba(0, 0, 0, 0)',
    allowanceToggleOffTrack: '#adadad',
    allowanceToggleOnTrack: sharedColors.mediumBlue,
    wrapEtherConfirmationButton: sharedColors.mediumBlue,
    drawerMenuBackground: '#4a4a4a',
    menuItemDefaultSelectedBackground: '#424242',
    jobsPageBackground: sharedColors.grey50,
    jobsPageOpenPositionRow: sharedColors.grey100,
};

export const colors = {
    ...sharedColors,
    ...appColors,
};
