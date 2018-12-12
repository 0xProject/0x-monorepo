import * as React from 'react';
import styled from 'styled-components';

import {Link} from 'ts/@next/components/button';
import { Icon } from 'ts/@next/components/icon';

interface Action {
    label: string;
    url: string;
}

interface Props {
    isInline?: boolean;
    isInlineIcon?: boolean;
    isCentered?: boolean;
    isWithMargin?: boolean;
    iconSize?: 'medium' | 'large' | number;
    title: string;
    description: React.Node;
    actions?: Action[];
}

export const Definition = (props: Props) => (
    <Wrap {...props}>
        <Icon
            name="ready-to-build"
            size={props.iconSize || 'medium'}
            margin={[0, 0, 'default', 0]}
        />

        <TextWrap>
            <Title>
                {props.title}
            </Title>

            <Paragraph>
                {props.description}
            </Paragraph>

            {props.actions &&
                <LinkWrap>
                    {props.actions.map((item, index) => (
                        <Link
                            href={item.url}
                            isWithArrow={true}
                            isTransparent={true}
                            isNoBorder={true}
                            isAccentColor={true}
                        >
                            {item.label}
                        </Link>
                    ))}
                </LinkWrap>
            }
        </TextWrap>
    </Wrap>
);

const Wrap = styled.div`
    max-width: ${props => props.isInline && '354px'};

    & + & {
        margin-top: ${props => props.isInlineIcon && '120px'};
        margin-top: ${props => props.isWithMargin && '60px'};
    }

    @media (min-width: 768px) {
        width: ${props => props.isInline ? 'calc(33.3333% - 30px)' : '100%'};
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

const TextWrap = styled.div`
    width: 100%;
    max-width: 560px;
`;

const Title = styled.h2`
    font-size: 20px;
    line-height: 1.3;
    margin-bottom: 15px;
`;

const Paragraph = styled.p`
    font-size: 17px;
    opacity: 0.75;
`;

const LinkWrap = styled.div`
    display: inline-flex;
    margin-top: 60px;

    a + a {
        margin-left: 60px;
    }
`;
