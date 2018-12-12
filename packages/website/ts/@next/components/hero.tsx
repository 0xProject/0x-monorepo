import * as React from 'react';
import styled from 'styled-components';

import {fadeIn} from 'ts/@next/constants/animations';

interface Props {
    title: string;
    description: string;
    figure?: React.ReactNode;
    actions?: React.ReactNode;
}

export const Hero = (props: Props) => (
    <Section>
        <Wrap isCentered={!props.figure}>
            {props.figure &&
                <Content width="400px">
                    {props.figure}
                </Content>
            }

            <Content width={props.figure ? '546px' : '678px'}>
                <Title isLarge={props.figure}>
                    {props.title}
                </Title>

                <Description>
                    {props.description}
                </Description>

                {props.actions &&
                    <ButtonWrap>
                        {props.actions}
                    </ButtonWrap>
                }
            </Content>
        </Wrap>
    </Section>
);

const Section = styled.section`
    padding: 120px 0;

    @media (max-width: 768px) {
        padding: 60px 0;
    }
`;

const Wrap = styled.div`
    width: calc(100% - 60px);
    margin: 0 auto;

    @media (min-width: 768px) {
        max-width: 1136px;
        flex-direction: row-reverse;
        display: flex;
        align-items: center;
        text-align: ${props => props.isCentered && 'center'};
        justify-content: ${props => props.isCentered ? 'center' : 'space-between'};
    }

    @media (max-width: 768px) {
        text-align: center;
    }
`;

const Title = styled.h1`
    font-size: ${props => props.isLarge ? '80px' : '58px'};
    font-weight: 300;
    line-height: 1.1;
    margin-bottom: 30px;
    opacity: 0;
    transform: translateY(10px);
    animation: ${fadeIn} 0.5s forwards;

    @media (max-width: 1024px) {
        font-size: 60px;
    }

    @media (max-width: 768px) {
        font-size: 46px;
    }
`;

const Description = styled.p`
    font-size: 22px;
    line-height: 31px;
    padding: 0;
    margin-bottom: 30px;
    opacity: 0.75;
    opacity: 0;
    transform: translateY(0);
    animation: ${fadeIn} 0.5s 0.15s forwards;
`;

const Content = styled.div`
    width: 100%;

    @media (min-width: 768px) {
        max-width: ${props => props.width};
    }
`;

const ButtonWrap = styled.div`
    display: inline-flex;
    align-items: center;

    > * {
        opacity: 0;
        transform: translateY(10px);
    }

    * + * {
        margin-left: 12px;
    }

    > *:nth-child(1) {
        animation: ${fadeIn} 0.6s 0.3s forwards;
    }
    > *:nth-child(2) {
        animation: ${fadeIn} 0.6s 0.4s forwards;
    }
`;
