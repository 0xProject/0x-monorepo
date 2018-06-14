import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { zIndex } from 'ts/utils/style';

export interface OverlayProps {
    children?: React.ReactNode;
    style?: React.CSSProperties;
    onClick?: () => void;
}

const style: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: zIndex.overlay,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
};

export const Overlay: React.StatelessComponent = (props: OverlayProps) => (
    <div style={{ ...style, ...props.style }} onClick={props.onClick}>
        {props.children}
    </div>
);

Overlay.defaultProps = {
    style: {},
    onClick: _.noop,
};

Overlay.displayName = 'Overlay';
