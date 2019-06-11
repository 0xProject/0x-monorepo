import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Heading, Paragraph } from 'ts/components/text';

export interface Action {
    label: string;
    url?: string;
    onClick?: () => void;
    shouldUseAnchorTag?: boolean;
}

interface Props {
    isInline?: boolean;
    isCentered?: boolean;
    isWithMargin?: boolean;
    fontSize?: 'default' | 'medium' | number;
    title: string;
    titleSize?: 'small' | 'default' | number;
    description: React.ReactNode | string;
    actions?: Action[];
}

export const SimpleDefinition = (props: Props) => (
    <Wrap {...props}>
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
    </Wrap>
);

const Wrap = styled.div<Props>`
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
