import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Button } from 'ts/components/button';
import { DocumentTitle } from 'ts/components/document_title';
import { Icon } from 'ts/components/icon';
import { Column, Section, WrapGrid } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';
import { constants } from 'ts/utils/constants';
import { documentConstants } from 'ts/utils/document_meta_constants';

interface BenefitProps {
    title: string;
    icon: string;
    description: string;
}

const benefits: BenefitProps[] = [
    {
        icon: 'milestoneGrants',
        title: 'Milestone Grants',
        description:
            'Receive non-dilutive capital ranging from $10,000 to $100,000, with grant sizes awarded based on the quality of your team, vision, execution, and community involvement.',
    },
    {
        icon: 'vcIntroductions',
        title: 'VC Introductions',
        description: 'Connect with leading venture capital firms that could participate in your next funding round.',
    },
    {
        icon: 'techSupport',
        title: 'Technical Support',
        description: 'Receive ongoing technical assistance from knowledgeable and responsive 0x developers.',
    },
    {
        icon: 'recruitingSupport',
        title: 'Recruiting Assistance',
        description: 'Grow your team by accessing an exclusive pool of top engineering and business operations talent.',
    },
    {
        icon: 'eficientDesign',
        title: 'Marketing and Design Help',
        description:
            'Get strategic advice on product positioning, customer acquisition, and UI/UX design that can impact the growth of your business.',
    },
    {
        icon: 'legalResources',
        title: 'Legal Resources',
        description: 'Access important legal resources that will help you navigate the regulatory landscape.',
    },
];

export const NextEcosystem = () => (
    <SiteWrap theme="light">
        <DocumentTitle {...documentConstants.ECOSYSTEM_PROGRAM} />
        <Section isTextCentered={true}>
            <Column>
                <Heading size="medium" isCentered={true}>
                    Jumpstart your Business on 0x
                </Heading>
                <Paragraph size="medium" isCentered={true} isMuted={true} marginBottom="0">
                    The Ecosystem Acceleration Program gives teams access to a variety of services including funding,
                    dedicated technical support, and recruiting assistance. We created the Ecosystem Acceleration
                    Program to bolster the expansion of both infrastructure projects and relayers building on 0x.
                </Paragraph>
                <LinkWrap>
                    <Button
                        href={constants.URL_ECOSYSTEM_APPLY}
                        isWithArrow={true}
                        isAccentColor={true}
                        shouldUseAnchorTag={true}
                    >
                        Apply now
                    </Button>
                    <Button
                        href={constants.URL_ECOSYSTEM_BLOG_POST}
                        isWithArrow={true}
                        isAccentColor={true}
                        shouldUseAnchorTag={true}
                        target="_blank"
                    >
                        Learn More
                    </Button>
                </LinkWrap>
            </Column>
        </Section>

        <Section bgColor={colors.backgroundLight} isFullWidth={true}>
            <Column>
                <Heading
                    size={34}
                    fontWeight="400"
                    asElement="h2"
                    isCentered={true}
                    maxWidth="507px"
                    marginBottom="70px"
                >
                    Join a vibrant ecosystem of projects in the 0x Network.
                </Heading>
            </Column>
            <WrapGrid isTextCentered={true} isWrapped={true} isFullWidth={true}>
                {_.map(benefits, (benefit: BenefitProps, index) => (
                    <Column key={`benefit-${index}`} width="33%" padding="0 45px 30px">
                        <Icon name={benefit.icon} size="medium" margin={[0, 0, 'small', 0]} />
                        <Heading color={colors.textDarkPrimary} size="small" marginBottom="10px" isCentered={true}>
                            {benefit.title}
                        </Heading>
                        <Paragraph isMuted={true} isCentered={true}>
                            {benefit.description}
                        </Paragraph>
                    </Column>
                ))}
            </WrapGrid>
        </Section>
    </SiteWrap>
);

const LinkWrap = styled.div`
    display: inline-flex;
    margin-top: 60px;

    a + a {
        margin-left: 60px;
    }
`;
