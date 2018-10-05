import * as React from 'react';

import { ColorOption, styled } from '../../style/theme';
import { cssRuleIfExists } from '../../style/util';

export interface ContainerProps {
    display?: string;
    position?: string;
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    width?: string;
    maxWidth?: string;
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    padding?: string;
    boxShadow?: string;
    borderRadius?: string;
    border?: string;
    borderColor?: ColorOption;
    borderTop?: string;
    className?: string;
    backgroundColor?: ColorOption;
}

const PlainContainer: React.StatelessComponent<ContainerProps> = ({ children, className }) => (
    <div className={className}>{children}</div>
);

export const Container = styled(PlainContainer)`
    ${props => cssRuleIfExists(props, 'display')}
    ${props => cssRuleIfExists(props, 'position')}
    ${props => cssRuleIfExists(props, 'top')}
    ${props => cssRuleIfExists(props, 'right')}
    ${props => cssRuleIfExists(props, 'bottom')}
    ${props => cssRuleIfExists(props, 'left')}
    ${props => cssRuleIfExists(props, 'width')}
    ${props => cssRuleIfExists(props, 'max-width')}
    ${props => cssRuleIfExists(props, 'margin')}
    ${props => cssRuleIfExists(props, 'margin-top')}
    ${props => cssRuleIfExists(props, 'margin-right')}
    ${props => cssRuleIfExists(props, 'margin-bottom')}
    ${props => cssRuleIfExists(props, 'margin-left')}
    ${props => cssRuleIfExists(props, 'padding')}
    ${props => cssRuleIfExists(props, 'box-shadow')}
    ${props => cssRuleIfExists(props, 'border-radius')}
    ${props => cssRuleIfExists(props, 'border')}
    ${props => cssRuleIfExists(props, 'border-top')}
    background-color: ${props => (props.backgroundColor ? props.theme[props.backgroundColor] : 'none')};
    border-color: ${props => (props.borderColor ? props.theme[props.borderColor] : 'none')};
`;

Container.defaultProps = {
    display: 'block',
};

Container.displayName = 'Container';
