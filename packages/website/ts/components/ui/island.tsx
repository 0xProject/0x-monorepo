import * as React from 'react';
import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';

export interface IslandProps {
    style?: React.CSSProperties;
    className?: string;
    Component?: string | React.ComponentClass<any> | React.StatelessComponent<any>;
}

const PlainIsland: React.StatelessComponent<IslandProps> = ({ Component, ...rest }) => <Component {...rest} />;

export const Island = styled(PlainIsland)`
    background-color: ${colors.white};
    border-radius: 10px;
    box-shadow: 0px 4px 6px ${colors.walletBoxShadow};
    overflow: hidden;
`;

Island.defaultProps = {
    Component: 'div',
    style: {},
};

Island.displayName = 'Island';
