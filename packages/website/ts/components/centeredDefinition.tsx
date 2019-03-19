import * as React from 'react';
import styled from 'styled-components';

import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';

export interface CenteredDefinitionProps {
    isInline: boolean;
    icon: string;
    iconSize?: 'medium' | 'large' | number;
    fontSize?: 'default' | 'medium' | number;
    title: string;
    titleSize?: 'small' | 'default' | number;
    description: React.ReactNode | string;
}

export const CenteredDefinition = (props: CenteredDefinitionProps) => (
    <Wrap {...props}>
        <Icon name={props.icon} size={props.iconSize || 'medium'} margin={[0, 0, 'default', 0]} />
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
        </TextWrap>
    </Wrap>
);

const Wrap = styled.div<CenteredDefinitionProps>`
    padding: 30px 15px;
    max-width: ${props => props.isInline && 'calc(50% - 30px)'};
    text-align: center;

    @media (max-width: 768px) {
        margin: 0 auto;
        max-width: 100%;
    }
`;

const TextWrap = styled.div<CenteredDefinitionProps>`
    width: 100%;
    max-width: 560px;
    text-align: center;
`;
