import { darken } from 'polished';

import { MediaChoice, stylesForMedia } from '../../style/media';
import { ColorOption, styled } from '../../style/theme';
import { cssRuleIfExists } from '../../style/util';

export interface ContainerProps {
    display?: MediaChoice;
    position?: string;
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    width?: MediaChoice;
    height?: MediaChoice;
    maxWidth?: string;
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    padding?: string;
    borderRadius?: MediaChoice;
    border?: string;
    borderColor?: ColorOption;
    borderTop?: string;
    borderBottom?: string;
    className?: string;
    backgroundColor?: ColorOption;
    rawBackgroundColor?: string;
    hasBoxShadow?: boolean;
    isHidden?: boolean;
    zIndex?: number;
    whiteSpace?: string;
    opacity?: number;
    cursor?: string;
    overflow?: string;
    darkenOnHover?: boolean;
    rawHoverColor?: string;
    boxShadowOnHover?: boolean;
    flexGrow?: string | number;
}

const getBackgroundColor = (theme: any, backgroundColor?: ColorOption, rawBackgroundColor?: string): string => {
    if (backgroundColor) {
        return theme[backgroundColor] as string;
    }
    if (rawBackgroundColor) {
        return rawBackgroundColor;
    }
    return 'none';
};

export const Container = styled.div<ContainerProps>`
    && {
        box-sizing: border-box;
        ${props => cssRuleIfExists(props, 'flex-grow')}
        ${props => cssRuleIfExists(props, 'position')}
        ${props => cssRuleIfExists(props, 'top')}
        ${props => cssRuleIfExists(props, 'right')}
        ${props => cssRuleIfExists(props, 'bottom')}
        ${props => cssRuleIfExists(props, 'left')}
        ${props => cssRuleIfExists(props, 'max-width')}
        ${props => cssRuleIfExists(props, 'margin')}
        ${props => cssRuleIfExists(props, 'margin-top')}
        ${props => cssRuleIfExists(props, 'margin-right')}
        ${props => cssRuleIfExists(props, 'margin-bottom')}
        ${props => cssRuleIfExists(props, 'margin-left')}
        ${props => cssRuleIfExists(props, 'padding')}
        ${props => cssRuleIfExists(props, 'border')}
        ${props => cssRuleIfExists(props, 'border-top')}
        ${props => cssRuleIfExists(props, 'border-bottom')}
        ${props => cssRuleIfExists(props, 'z-index')}
        ${props => cssRuleIfExists(props, 'white-space')}
        ${props => cssRuleIfExists(props, 'opacity')}
        ${props => cssRuleIfExists(props, 'cursor')}
        ${props => cssRuleIfExists(props, 'overflow')}
        ${props => cssRuleIfExists(props, 'alignSelf')}
        ${props => (props.overflow === 'scroll' ? `-webkit-overflow-scrolling: touch` : '')};
        ${props => (props.hasBoxShadow ? `box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1)` : '')};
        ${props => props.display && stylesForMedia<string>('display', props.display)}
        ${props => props.width && stylesForMedia<string>('width', props.width)}
        ${props => props.height && stylesForMedia<string>('height', props.height)}
        ${props => props.borderRadius && stylesForMedia<string>('border-radius', props.borderRadius)}
        ${props => (props.isHidden ? 'visibility: hidden;' : '')}
        background-color: ${props => getBackgroundColor(props.theme, props.backgroundColor, props.rawBackgroundColor)};
        border-color: ${props => (props.borderColor ? props.theme[props.borderColor] : 'none')};
        &:hover {
            ${props => (props.rawHoverColor ? `background-color: ${props.rawHoverColor}` : '')}
            ${props =>
                props.darkenOnHover
                    ? `background-color: ${
                          props.backgroundColor ? darken(0.05, props.theme[props.backgroundColor]) : 'none'
                      }`
                    : ''};
            ${props => (props.boxShadowOnHover ? 'box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1)' : '')};
        }
    }
`;

Container.defaultProps = {
    display: 'block',
};

Container.displayName = 'Container';
