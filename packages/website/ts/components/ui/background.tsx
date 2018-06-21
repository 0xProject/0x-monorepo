import { colors } from '@0xproject/react-shared';
import * as React from 'react';
import { styled } from 'ts/style/theme';
import { zIndex } from 'ts/style/z_index';

export interface BackgroundProps {
    color?: string;
}

const PlainBackground: React.StatelessComponent<BackgroundProps> = props => <div {...props} />;

export const Background = styled(PlainBackground)`
    background-color: ${props => props.color};
    height: 100vh;
    width: 100vw;
    position: fixed;
    z-index: ${zIndex.background};
`;

Background.defaultProps = {
    color: colors.lightestGrey,
};

Background.displayName = 'Background';
