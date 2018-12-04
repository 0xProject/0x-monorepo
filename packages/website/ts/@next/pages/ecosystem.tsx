import * as React from 'react';

import { colors } from 'ts/style/colors';

import {Button} from 'ts/@next/components/button';
import { Column, Section, Wrap, WrapCentered } from 'ts/@next/components/layout';
import { SiteWrap } from 'ts/@next/components/siteWrap';
import { Heading, Paragraph } from 'ts/@next/components/text';

import RightThingIcon from 'ts/@next/icons/illustrations/right-thing.svg';

export const NextEcosystem = () => (
  <SiteWrap theme="light">
    <Section>
        <WrapCentered>
            <Heading size="medium" isCentered={true}>
                Jumpstart your Business on 0x
            </Heading>
            <Paragraph size="medium" isCentered={true} isMuted={true}>
                The Ecosystem Acceleration Program gives teams access to a variety of services including funding, personalized technical support, and recruiting assistance. We created the Ecosystem Acceleration Program to bolster the expansion of both infrastructure projects and relayers building on 0x.
            </Paragraph>
            <div>
                <a href="#">Get Started</a>
                <a href="#">Learn More</a>
            </div>
        </WrapCentered>
    </Section>

    <Section bgColor={colors.backgroundLight}>
        <Wrap>
            <Column>
                <Heading size="small" color={colors.brandDark} isCentered={true}>
                    Join a vibrant ecosystem of projects in the 0x Network.
                </Heading>
            </Column>
        </Wrap>
      <Wrap>
        {/* This */}
        <Column colWidth="1/3">
            <RightThingIcon width="60" />
            <Heading color={colors.textDarkPrimary} size="small">
                Milestone Grants
            </Heading>
            <Paragraph isMuted={0.5}>
                Receive non-dilutive capital ranging from $10,000 to $100,000, with grant sizes awarded based on the quality of your team, vision, execution, and community involvement.
            </Paragraph>
        </Column>

        <Column colWidth="1/3">
            <RightThingIcon width="60" />
            <Heading color={colors.textDarkPrimary} size="small">
                VC Introductions
            </Heading>
            <Paragraph isMuted={0.5}>
                Connect with leading venture capital firms that could participate in your next funding round.
            </Paragraph>
        </Column>

        <Column colWidth="1/3">
            <RightThingIcon width="60" />
            <Heading color={colors.textDarkPrimary} size="small">
                Technical Support
            </Heading>
            <Paragraph isMuted={0.5}>
                Receive ongoing technical assistance from knowledgeable and responsive 0x developers.
            </Paragraph>
        </Column>
        <Column colWidth="1/3">
            <RightThingIcon width="60" />
            <Heading color={colors.textDarkPrimary} size="small">
                Recruiting Assistance
            </Heading>
            <Paragraph isMuted={0.5}>
                Grow your team by accessing an exclusive pool of top engineering and business operations talent.
            </Paragraph>
        </Column>
        <Column colWidth="1/3">
            <RightThingIcon width="60" />
            <Heading color={colors.textDarkPrimary} size="small">
                Marketing and Design Help
            </Heading>
            <Paragraph isMuted={0.5}>
                Get strategic advice on product positioning, customer acquisition, and UI/UX design that can impact the growth of your business.
            </Paragraph>
        </Column>
        <Column colWidth="1/3">
            <RightThingIcon width="60" />
            <Heading color={colors.textDarkPrimary} size="small">
                Legal Resources
            </Heading>
            <Paragraph isMuted={0.5}>
                Obtain important legal documents and resources that will help you navigate the regulatory landscape.
            </Paragraph>
        </Column>
      </Wrap>
    </Section>

    <Section bgColor={colors.brandDark}>
        <Wrap>
            <Column colWidth="1/2" isPadLarge={true}>
                <WrapCentered>
                    <Heading>
                        Apply for the program now
                    </Heading>
                    <Paragraph>
                        Have questions? Please join our Discord channel
                    </Paragraph>
                </WrapCentered>
            </Column>

            <Column colWidth="1/2" isPadLarge={true}>
                <WrapCentered>
                    <div>
                        <Button href="#">Apply Now</Button>
                        <Button href="#" isTransparent={true}>Join Discord</Button>
                    </div>
                </WrapCentered>
            </Column>
        </Wrap>
    </Section>
  </SiteWrap>
);
