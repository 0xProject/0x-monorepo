import * as React from 'react';
import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';

export interface IslandProps {
    style?: React.CSSProperties;
    className?: string;
    Component?: string | React.ComponentClass<any> | React.StatelessComponent<any>;
    borderRadius?: string;
}

const PlainIsland: React.StatelessComponent<IslandProps> = ({ Component, style, className, children }) => (
    <Component style={style} className={className} children={children} />
);

export const Island = styled(PlainIsland)`
    background-color: ${colors.white};
    border-radius: ${props => props.borderRadius};
    box-shadow: 0px 4px 6px ${colors.walletBoxShadow};
    overflow: hidden;
`;

Island.defaultProps = {
    Component: 'div',
    borderRadius: '10px',
    style: {},
};

Island.displayName = 'Island';
