import { colors as sharedColors } from '@0xproject/react-shared';

const appColors = {
    walletBoxShadow: 'rgba(56, 59, 137, 0.2)',
    walletBorder: '#ededee',
    walletDefaultItemBackground: '#fbfbfc',
    walletFocusedItemBackground: '#f0f1f4',
    allowanceToggleShadow: 'rgba(0, 0, 0, 0)',
    allowanceToggleOffTrack: '#adadad',
    allowanceToggleOnTrack: sharedColors.mediumBlue,
    wrapEtherConfirmationButton: sharedColors.mediumBlue,
};

export const colors = {
    ...sharedColors,
    ...appColors,
};
