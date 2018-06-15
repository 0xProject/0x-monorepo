import { colors } from '@0xproject/react-shared';
import { darken } from 'polished';
import * as React from 'react';
import { styled } from 'ts/style/theme';

export type TextTag = 'p' | 'div' | 'span' | 'label' | 'h1' | 'h2' | 'h3' | 'h4';

export interface TextProps {
    className?: string;
    Tag?: TextTag;
    fontSize?: string;
    fontFamily?: string;
    fontColor?: string;
    lineHeight?: string;
    minHeight?: string;
    center?: boolean;
    fontWeight?: number | string;
    onClick?: () => void;
}

const PlainText: React.StatelessComponent<TextProps> = ({ children, className, onClick, Tag }) => (
    <Tag className={className} onClick={onClick}>
        {children}
    </Tag>
);

export const Text = styled(PlainText)`
    font-family: ${props => props.fontFamily};
    font-weight: ${props => props.fontWeight};
    font-size: ${props => props.fontSize};
    ${props => (props.lineHeight ? `line-height: ${props.lineHeight}` : '')};
    ${props => (props.center ? 'text-align: center' : '')};
    color: ${props => props.fontColor};
    ${props => (props.minHeight ? `min-height: ${props.minHeight}` : '')};
    ${props => (props.onClick ? 'cursor: pointer' : '')};
    transition: color 0.5s ease;
    &:hover {
        ${props => (props.onClick ? `color: ${darken(0.1, props.fontColor)}` : '')};
    }
`;

Text.defaultProps = {
    fontFamily: 'Roboto',
    fontWeight: 400,
    fontColor: colors.black,
    fontSize: '15px',
    Tag: 'div',
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
