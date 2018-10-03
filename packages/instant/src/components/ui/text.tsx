import { darken } from 'polished';
import * as React from 'react';

import { ColorOption, styled } from '../../style/theme';

export type TextTag = 'p' | 'div' | 'span' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'i';

export interface TextProps {
    fontColor: ColorOption;
    fontFamily: string;
    fontStyle: string;
    fontSize: string;
    lineHeight: string;
    className?: string;
    Tag?: TextTag;
    minHeight?: string;
    center?: boolean;
    fontWeight?: number | string;
    textDecorationLine?: string;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    hoverColor?: string;
    noWrap?: boolean;
    display?: string;
}

const PlainText: React.StatelessComponent<TextProps> = ({ children, className, onClick, Tag }) => (
    <Tag className={className} onClick={onClick}>
        {children}
    </Tag>
);

const darkenOnHoverAmount = 0.3;
export const Text = styled(PlainText)`
    font-family: ${props => props.fontFamily};
    font-style: ${props => props.fontStyle};
    font-weight: ${props => props.fontWeight};
    font-size: ${props => props.fontSize};
    text-decoration-line: ${props => props.textDecorationLine};
    ${props => (props.lineHeight ? `line-height: ${props.lineHeight}` : '')};
    ${props => (props.center ? 'text-align: center' : '')};
    color: ${props => props.theme[props.fontColor]};
    ${props => (props.minHeight ? `min-height: ${props.minHeight}` : '')};
    ${props => (props.onClick ? 'cursor: pointer' : '')};
    transition: color 0.5s ease;
    ${props => (props.noWrap ? 'white-space: nowrap' : '')};
    ${props => (props.display ? `display: ${props.display}` : '')};
    &:hover {
        ${props => (props.onClick ? `color: ${props.hoverColor || darken(darkenOnHoverAmount, props.fontColor)}` : '')};
    }
`;

Text.defaultProps = {
    fontFamily: 'Inter UI',
    fontStyle: 'normal',
    fontWeight: 400,
    fontColor: ColorOption.black,
    fontSize: '15px',
    lineHeight: '1.5em',
    textDecorationLine: 'none',
    Tag: 'div',
    noWrap: false,
};

Text.displayName = 'Text';

export const Title: React.StatelessComponent<TextProps> = props => <Text {...props} />;

Title.defaultProps = {
    Tag: 'h2',
    fontSize: '20px',
    fontWeight: 600,
    fontColor: ColorOption.primaryColor,
};

Title.displayName = 'Title';
