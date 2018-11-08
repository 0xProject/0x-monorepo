import { darken } from 'polished';
import * as React from 'react';

import { ColorOption, styled } from '../../style/theme';

export interface TextProps {
    fontColor?: ColorOption;
    fontFamily?: string;
    fontStyle?: string;
    fontSize?: string;
    opacity?: number;
    letterSpacing?: string;
    textTransform?: string;
    lineHeight?: string;
    className?: string;
    minHeight?: string;
    center?: boolean;
    fontWeight?: number | string;
    textDecorationLine?: string;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    noWrap?: boolean;
    display?: string;
}

const darkenOnHoverAmount = 0.3;
export const Text =
    styled.div <
    TextProps >
    `
    && {
        font-family: 'Inter UI', sans-serif;
        font-style: ${props => props.fontStyle};
        font-weight: ${props => props.fontWeight};
        font-size: ${props => props.fontSize};
        opacity: ${props => props.opacity};
        text-decoration-line: ${props => props.textDecorationLine};
        ${props => (props.lineHeight ? `line-height: ${props.lineHeight}` : '')};
        ${props => (props.center ? 'text-align: center' : '')};
        color: ${props => props.fontColor && props.theme[props.fontColor]};
        ${props => (props.minHeight ? `min-height: ${props.minHeight}` : '')};
        ${props => (props.onClick ? 'cursor: pointer' : '')};
        transition: color 0.5s ease;
        ${props => (props.noWrap ? 'white-space: nowrap' : '')};
        ${props => (props.display ? `display: ${props.display}` : '')};
        ${props => (props.letterSpacing ? `letter-spacing: ${props.letterSpacing}` : '')};
        ${props => (props.textTransform ? `text-transform: ${props.textTransform}` : '')};
        &:hover {
            ${props =>
                props.onClick ? `color: ${darken(darkenOnHoverAmount, props.theme[props.fontColor || 'white'])}` : ''};
        }
    }
`;

Text.defaultProps = {
    fontFamily: 'Inter UI',
    fontStyle: 'normal',
    fontWeight: 400,
    fontColor: ColorOption.black,
    fontSize: '15px',
    textDecorationLine: 'none',
    noWrap: false,
    display: 'inline-block',
};

Text.displayName = 'Text';
