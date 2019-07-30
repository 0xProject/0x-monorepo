import { darken } from 'polished';
import * as React from 'react';
import { styled } from 'ts/style/theme';
import { colors } from 'ts/utils/colors';

export type TextTag = 'p' | 'div' | 'span' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'i' | 'span';

export interface TextProps {
    className?: string;
    children?: any;
    Tag?: TextTag;
    fontSize?: string;
    fontFamily?: string;
    fontStyle?: string;
    fontColor?: string;
    lineHeight?: string;
    minHeight?: string;
    center?: boolean;
    fontWeight?: number | string;
    textDecorationLine?: string;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    hoverColor?: string;
    letterSpacing?: string | number;
    noWrap?: boolean;
    textAlign?: string;
    display?: string;
}

const PlainText: React.StatelessComponent<TextProps> = ({ children, className, onClick, Tag }) => (
    <Tag className={className} onClick={onClick}>
        {children}
    </Tag>
);

export const Text = styled(PlainText)`
    font-family: ${props => props.fontFamily};
    font-style: ${props => props.fontStyle};
    font-weight: ${props => props.fontWeight};
    font-size: ${props => props.fontSize};
    text-align: ${props => props.textAlign};
    letter-spacing: ${props => props.letterSpacing};
    text-decoration-line: ${props => props.textDecorationLine};
    ${props => (props.lineHeight ? `line-height: ${props.lineHeight}` : '')};
    ${props => (props.center ? 'text-align: center' : '')};
    color: ${props => props.fontColor};
    ${props => (props.minHeight ? `min-height: ${props.minHeight}` : '')};
    ${props => (props.onClick ? 'cursor: pointer' : '')};
    transition: color 0.5s ease;
    ${props => (props.noWrap ? 'white-space: nowrap' : '')};
    ${props => (props.display ? `display: ${props.display}` : '')};
    &:hover {
        ${props => (props.onClick ? `color: ${props.hoverColor || darken(0.3, props.fontColor)}` : '')};
    }
`;

Text.defaultProps = {
    fontFamily: 'Roboto',
    fontStyle: 'normal',
    fontWeight: 400,
    fontColor: colors.black,
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
    fontColor: colors.black,
};

Title.displayName = 'Title';
