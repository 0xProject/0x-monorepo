import * as React from 'react';
import { colors } from 'ts/style/colors';
import { Styleable } from 'ts/types';

export interface IslandProps {
    style?: React.CSSProperties;
    children?: React.ReactNode;
    className?: string;
    Component?: string | React.ComponentClass<any> | React.StatelessComponent<any>;
}

const defaultStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    boxShadow: `0px 4px 6px ${colors.walletBoxShadow}`,
    overflow: 'hidden',
};

export const Island: React.StatelessComponent<IslandProps> = (props: IslandProps) => (
    <props.Component style={{ ...defaultStyle, ...props.style }} className={props.className}>
        {props.children}
    </props.Component>
);

Island.defaultProps = {
    Component: 'div',
    style: {},
};

Island.displayName = 'Island';
