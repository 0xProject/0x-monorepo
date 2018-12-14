import * as React from 'react';
import styled from 'styled-components';

import {Button} from 'ts/@next/components/button';
import {Icon, InlineIconWrap} from 'ts/@next/components/icon';
import {Column, FlexWrap, Section} from 'ts/@next/components/newLayout';
import {Paragraph} from 'ts/@next/components/text';

interface FigureProps {
    value: string;
    description: string;
}

export const SectionLandingAbout = () => (
    <Section bgColor="dark" isTextCentered={true}>
        <InlineIconWrap>
            <Icon name="descriptionCoin" size="small" />
            <Icon name="descriptionCopy" size="small" />
            <Icon name="descriptionFlask" size="small" />
            <Icon name="descriptionBolt" size="small" />
        </InlineIconWrap>

        <Paragraph
            size="large"
            isCentered={true}
            isMuted={1}
            padding={['large', 0, 'default', 0]}
        >
            Anyone in the world can use 0x to service a wide variety of markets ranging from gaming items to financial instruments to assets that could have near existed before.
        </Paragraph>

        <Button
            href="#"
            isWithArrow={true}
            isAccentColor={true}
        >
            Discover how developers use 0x
        </Button>

        <hr
            style={{
                width: '340px',
                borderColor: '#3C4746',
                margin: '60px auto',
            }}
        />

        <FlexWrap as="dl">
            <Figure
                value="873,435"
                description="Number of Transactions"
            />

            <Figure
                value="$203M"
                description="Total Volume"
            />

            <Figure
                value="227,372"
                description="Number of Relayers"
            />
        </FlexWrap>
    </Section>
);

const Figure = (props: FigureProps) => (
    <Column padding="0 30px">
        <FigureValue>
            {props.value}
        </FigureValue>
        <FigureDescription>
            {props.description}
        </FigureDescription>
    </Column>
);

const FigureValue = styled.dt`
    font-size: 50px;
    font-weight: 300;
    margin-bottom: 15px;

    @media (max-width: 768px) {
        font-size: 40px;
    }
`;

const FigureDescription = styled.dd`
    font-size: 18px;
    color: #999999;
`;
