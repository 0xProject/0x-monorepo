import * as _ from 'lodash';

import { overlayBlack, styled } from '../../style/theme';
import { zIndex } from '../../style/z_index';

export interface OverlayProps {
    zIndex?: number;
    backgroundColor?: string;
}

export const Overlay =
    styled.div <
    OverlayProps >
    `
    && {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: ${props => props.zIndex}
        background-color: ${props => props.backgroundColor};
    }
`;

Overlay.defaultProps = {
    zIndex: zIndex.overlayDefault,
    backgroundColor: overlayBlack,
};

Overlay.displayName = 'Overlay';
