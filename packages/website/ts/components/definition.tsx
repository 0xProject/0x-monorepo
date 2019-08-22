import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';

export interface Action {
    label: string;
    url?: string;
    onClick?: () => void;
    shouldUseAnchorTag?: boolean;
}

export interface DefinitionProps {
    isInline?: boolean;
    isInlineIcon?: boolean;
    isCentered?: boolean;
    isWithMargin?: boolean;
    icon?: string;
    iconSize?: 'medium' | 'large' | number;
    fontSize?: 'default' | 'medium' | number;
    title: string;
    titleSize?: 'small' | 'default' | number;
    description: React.ReactNode | string;
    actions?: Action[];
    className?: string;
}

export const Definition = ({ className, ...props }: DefinitionProps) => (
    <Wrap {...props} className={className}>
        {!!props.icon && <Icon name={props.icon} size={props.iconSize || 'medium'} margin={[0, 0, 'default', 0]} />}

        <TextWrap {...props}>
            <Heading
                asElement="h2"
                fontWeight="400"
                marginBottom={props.titleSize === 'small' ? '7px' : '15px'}
                size={props.titleSize || 'default'}
            >
                {props.title}
            </Heading>

            {typeof props.description === 'string' ? (
                <Paragraph isMuted={true} size={props.fontSize || 'default'}>
                    {props.description}
                </Paragraph>
            ) : (
                <>{props.description}</>
            )}

            {props.actions && (
                <LinkWrap>
                    {props.actions.map((item, index) => (
                        <Button
                            key={`dlink-${index}`}
                            href={item.url}
                            onClick={item.onClick}
                            isWithArrow={true}
                            isAccentColor={true}
                            shouldUseAnchorTag={item.shouldUseAnchorTag}
                            target="_blank"
                        >
                            {item.label}
                        </Button>
                    ))}
                </LinkWrap>
            )}
        </TextWrap>
    </Wrap>
);

const Wrap = styled.div<DefinitionProps>`
    max-width: ${props => props.isInline && '354px'};

    & + & {
        margin-top: ${props => props.isInlineIcon && '120px'};
        margin-top: ${props => props.isWithMargin && '60px'};
    }

    @media (min-width: 768px) {
        width: ${props => (props.isInline ? 'calc(33.3333% - 30px)' : '100%')};
        display: ${props => props.isInlineIcon && 'flex'};
        justify-content: ${props => props.isInlineIcon && 'space-between'};
        align-items: ${props => props.isInlineIcon && 'center'};
        text-align: ${props => (props.isInlineIcon || !props.isCentered) && 'left'};
    }

    @media (max-width: 768px) {
        margin: 0 auto;

        & + & {
            margin-top: ${props => props.isInline && '60px'};
        }
    }
`;

const TextWrap = styled.div<DefinitionProps>`
    width: 100%;
    max-width: 560px;

    ul {
        padding-top: 10px;
        padding-left: 1rem;
    }

    li {
        color: ${props => props.theme.paragraphColor};
        font-size: ${props => `var(--${props.fontSize || 'default'}Paragraph)`};
        font-weight: 300;
        list-style: disc;
        opacity: 0.75;
        line-height: 1.444444444;
        margin-bottom: 1rem;
    }

    @media (min-width: 768px) {
        margin-left: ${props => props.isInlineIcon && '60px'};
    }
`;

const LinkWrap = styled.div`
    margin-top: 60px;

    @media (min-width: 768px) {
        display: inline-flex;

        a + a {
            margin-left: 60px;
        }
    }

    @media (max-width: 768px) {
        max-width: 250px;

        a + a {
            margin-top: 15px;
        }
    }
`;
