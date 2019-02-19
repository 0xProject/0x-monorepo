import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { AboutPageLayout } from 'ts/components/aboutPageLayout';
import { Definition } from 'ts/components/definition';
import { DocumentTitle } from 'ts/components/documentTitle';
import { Image } from 'ts/components/image';
import { Column, Section } from 'ts/components/newLayout';
import { Heading } from 'ts/components/text';
import { constants } from 'ts/utils/constants';

const values = [
    {
        title: 'Do The Right Thing',
        description:
            'We acknowledge the broad subjectivity behind doing “the right thing,” and are committed to rigorously exploring its nuance in our decision making. We believe this responsibility drives our decision making above all else, and pledge to act in the best interest of our peers, community, and society as a whole.',
        icon: 'right-thing',
    },
    {
        title: 'Consistently Ship',
        description:
            'Achieving our mission requires dedication and diligence. We aspire to be an organization that consistently ships. We set high-impact goals that are rooted in data and pride ourselves in consistently outputting outstanding results across the organization.',
        icon: 'consistently-ship',
    },
    {
        title: 'Focus on Long-term Impact',
        description:
            'We anticipate that over time, awareness of the fundamentally disruptive nature of frictionless global exchange will cause some to see this technology as a threat. There will be setbacks, some will claim that this technology is too disruptive, and we will face adversity. Persistence and a healthy long-term focus will see us through these battles.',
        icon: 'long-term-impact',
    },
];

export const NextAboutMission = () => (
    <AboutPageLayout
        title="Creating a tokenized world where all value can flow freely."
        description="0x is important infrastructure for the emerging crypto economy and enables markets to be created that couldn't have existed before. As more assets become tokenized, public blockchains provide the opportunity to establish a new financial stack that is more efficient, transparent, and equitable than any system in the past."
        linkLabel="Our mission and values"
        href={constants.URL_MISSION_AND_VALUES_BLOG_POST}
    >
        <DocumentTitle title="Our Mission - 0x" />
        <Section isFullWidth={true} isPadded={false}>
            <FullWidthImage>
                <Image src="/images/about/about-office.png" alt="0x Offices" isCentered={true} />
            </FullWidthImage>
        </Section>

        <Section isFlex={true} maxWidth="1170px" wrapWidth="100%">
            <Column>
                <Heading size="medium" maxWidth="226px">
                    Core Values
                </Heading>
            </Column>

            <Column width="70%" maxWidth="826px">
                <Column width="100%" maxWidth="800px">
                    {_.map(values, (item, index) => (
                        <StyledDefinition
                            icon={item.icon}
                            title={item.title}
                            description={item.description}
                            isInlineIcon={true}
                            iconSize="large"
                        />
                    ))}
                </Column>
            </Column>
        </Section>
    </AboutPageLayout>
);

const StyledDefinition = styled(Definition)`
    & + & {
        margin-top: 30px;
        padding-top: 30px;
        border-top: 1px solid #eaeaea;
    }
`;

const FullWidthImage = styled.figure`
    width: 100vw;
    margin-left: calc(50% - 50vw);

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    @media (min-width: 768px) {
        height: 500px;
    }

    @media (max-width: 768px) {
        height: 400px;
    }
`;
