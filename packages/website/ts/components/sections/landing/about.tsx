import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Icon, InlineIconWrap } from 'ts/components/icon';
import { Column, FlexWrap, Section } from 'ts/components/newLayout';
import { Paragraph } from 'ts/components/text';
import { WebsitePaths } from 'ts/types';

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

        <Paragraph size="large" isCentered={true} isMuted={1} padding={['large', 0, 'default', 0]}>
            Anyone in the world can use 0x to service a wide variety of markets ranging from gaming items to financial
            instruments to assets that could have never existed before.
        </Paragraph>

        <DeveloperLink href={`${WebsitePaths.Why}#cases`} isWithArrow={true} isAccentColor={true}>
            Discover how developers use 0x
        </DeveloperLink>

        <hr
            style={{
                width: '100%',
                maxWidth: '340px',
                borderColor: '#3C4746',
                margin: '60px auto',
            }}
        />

        <FlexWrap as="dl">
            <Figure value="713K" description="Total Transactions" />

            <Figure value="$750M" description="Total Volume" />

            <Figure value="30+" description="Total Projects" />
        </FlexWrap>
    </Section>
);

const Figure = (props: FigureProps) => (
    <Column padding="0 30px">
        <FigureValue>{props.value}</FigureValue>
        <FigureDescription>{props.description}</FigureDescription>
    </Column>
);

const DeveloperLink = styled(Button)`
    @media (max-width: 500px) {
        && {
            white-space: pre-wrap;
            line-height: 1.3;
        }
    }
`;

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
