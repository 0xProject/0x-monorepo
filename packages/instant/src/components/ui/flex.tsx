import * as React from 'react';

import { ColorOption, styled } from '../../style/theme';
import { cssRuleIfExists } from '../../style/util';

export interface FlexProps {
    direction?: 'row' | 'column';
    flexWrap?: 'wrap' | 'nowrap';
    justify?: 'flex-start' | 'center' | 'space-around' | 'space-between' | 'space-evenly' | 'flex-end';
    align?: 'flex-start' | 'center' | 'space-around' | 'space-between' | 'space-evenly' | 'flex-end';
    width?: string;
    backgroundColor?: ColorOption;
    className?: string;
}

const PlainFlex: React.StatelessComponent<FlexProps> = ({ children, className }) => (
    <div className={className}>{children}</div>
);

export const Flex = styled(PlainFlex)`
    display: flex;
    flex-direction: ${props => props.direction};
    flex-wrap: ${props => props.flexWrap};
    justify-content: ${props => props.justify};
    align-items: ${props => props.align};
    ${props => cssRuleIfExists(props, 'width')}
    background-color: ${props => (props.backgroundColor ? props.theme[props.backgroundColor] : 'none')};
`;

Flex.defaultProps = {
    direction: 'row',
    flexWrap: 'nowrap',
    justify: 'center',
    align: 'center',
};

Flex.displayName = 'Flex';
