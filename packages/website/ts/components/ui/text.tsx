import { colors } from '@0xproject/react-shared';
import * as React from 'react';
import { styled } from 'ts/style/theme';
import { Deco, Key } from 'ts/types';
import { Translate } from 'ts/utils/translate';

export type TextTag = 'p' | 'div' | 'span' | 'label';

export interface TextProps {
    className?: string;
    Tag?: TextTag;
    fontSize?: string;
    fontFamily?: string;
    fontColor?: string;
    lineHeight?: string;
    center?: boolean;
    fontWeight?: number;
}

const PlainText: React.StatelessComponent<TextProps> = ({ children, className, Tag }) => (
    <Tag className={className}>{children}</Tag>
);

export const Text = styled(PlainText)`
    font-family: ${props => props.fontFamily};
    font-weight: ${props => props.fontWeight};
    font-size: ${props => props.fontSize};
    ${props => (props.lineHeight ? `line-height: ${props.lineHeight}` : '')};
    ${props => (props.center ? 'text-align: center' : '')};
    color: ${props => props.fontColor};
`;

Text.defaultProps = {
    fontFamily: 'Roboto',
    fontWeight: 400,
    fontColor: colors.white,
    fontSize: '14px',
    Tag: 'div',
};

Text.displayName = 'Text';

interface TranslatedProps {
    children: Key;
    translate: Translate;
    deco?: Deco;
}

export type TranslatedTextProps = TextProps & TranslatedProps;

export const TranslatedText: React.StatelessComponent<TranslatedTextProps> = ({
    translate,
    children,
    deco,
    ...textProps,
}) => <Text {...textProps}>{translate.get(children, deco)}</Text>;
