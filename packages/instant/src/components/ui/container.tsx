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
    height?: string;
    maxWidth?: string;
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    padding?: string;
    borderRadius?: string;
    border?: string;
    borderColor?: ColorOption;
    borderTop?: string;
    borderBottom?: string;
    className?: string;
    backgroundColor?: ColorOption;
    hasBoxShadow?: boolean;
    zIndex?: number;
    whiteSpace?: string;
    opacity?: number;
}

export const Container =
    styled.div <
    ContainerProps >
    `
    box-sizing: border-box;
    ${props => cssRuleIfExists(props, 'display')}
    ${props => cssRuleIfExists(props, 'position')}
    ${props => cssRuleIfExists(props, 'top')}
    ${props => cssRuleIfExists(props, 'right')}
    ${props => cssRuleIfExists(props, 'bottom')}
    ${props => cssRuleIfExists(props, 'left')}
    ${props => cssRuleIfExists(props, 'width')}
    ${props => cssRuleIfExists(props, 'height')}
    ${props => cssRuleIfExists(props, 'max-width')}
    ${props => cssRuleIfExists(props, 'margin')}
    ${props => cssRuleIfExists(props, 'margin-top')}
    ${props => cssRuleIfExists(props, 'margin-right')}
    ${props => cssRuleIfExists(props, 'margin-bottom')}
    ${props => cssRuleIfExists(props, 'margin-left')}
    ${props => cssRuleIfExists(props, 'padding')}
    ${props => cssRuleIfExists(props, 'border-radius')}
    ${props => cssRuleIfExists(props, 'border')}
    ${props => cssRuleIfExists(props, 'border-top')}
    ${props => cssRuleIfExists(props, 'border-bottom')}
    ${props => cssRuleIfExists(props, 'z-index')}
    ${props => cssRuleIfExists(props, 'white-space')}
    ${props => cssRuleIfExists(props, 'opacity')}
    ${props => (props.hasBoxShadow ? `box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1)` : '')};
    background-color: ${props => (props.backgroundColor ? props.theme[props.backgroundColor] : 'none')};
    border-color: ${props => (props.borderColor ? props.theme[props.borderColor] : 'none')};
`;

Container.defaultProps = {
    display: 'block',
};

Container.displayName = 'Container';
