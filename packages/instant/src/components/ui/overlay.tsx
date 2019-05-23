import * as _ from 'lodash';

import { generateMediaWrapper, ScreenWidths } from '../../style/media';
import { generateOverlayBlack, styled } from '../../style/theme';
import { zIndex } from '../../style/z_index';

export interface OverlayProps {
    zIndex?: number;
    backgroundColor?: string;
    width?: string;
    height?: string;
    showMaxWidth?: ScreenWidths;
}

export const Overlay = styled.div<OverlayProps>`
    && {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: ${props => props.zIndex}
        background-color: ${props => props.backgroundColor};
        ${props => props.width && `width: ${props.width};`}
        ${props => props.height && `height: ${props.height};`}
        display: ${props => (props.showMaxWidth ? 'none' : 'block')};
        ${props => props.showMaxWidth && generateMediaWrapper(props.showMaxWidth)`display: block;`}
    }
`;

Overlay.defaultProps = {
    zIndex: zIndex.overlayDefault,
    backgroundColor: generateOverlayBlack(0.7),
};

Overlay.displayName = 'Overlay';
