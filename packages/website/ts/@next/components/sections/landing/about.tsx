import * as React from 'react';
import {Button, ButtonWrap, Link} from 'ts/@next/components/button';
import {Icon, InlineIconWrap} from 'ts/@next/components/icon';
import {Column, Section, Wrap, WrapCentered, WrapGrid} from 'ts/@next/components/layout';
import {Heading, Paragraph} from 'ts/@next/components/text';
import {colors} from 'ts/style/colors';

export const SectionLandingAbout = () => (
    <Section bgColor={colors.backgroundDark} isPadLarge={true}>
        <WrapCentered width="narrow">
            <InlineIconWrap>
                <Icon name="coin" size="small" />
                <Icon name="coin" size="small" />
                <Icon name="coin" size="small" />
                <Icon name="coin" size="small" />
            </InlineIconWrap>

            <Paragraph
                size="large"
                isCentered={true}
                padding={['large', 0, 'default', 0]}
            >
                0x is an open protocol that enables the peer-to-peer exchange of Ethereum-based
                tokens. Anyone in the world can use 0x to service a wide variety of markets
                ranging from gaming items to financial instruments to assets that could have
                near existed before.
            </Paragraph>

            <Link
                href="#"
                isTransparent={true}
                isWithArrow={true}
                isAccentColor={true}
            >
                Discover how developers use 0x
            </Link>

            <hr
                style={{
                    width: '340px',
                    borderColor: '#3C4746',
                    margin: '60px auto 0 auto',
                }}
            />
        </WrapCentered>

        {/* Note you can also pass in a string "large/default" or a number for custom margins */}
        <Wrap padding={['large', 0, 0, 0]}>
            {/* NOTE: this probably should be withComponent as part of a <dl> */}
            <Column colWidth="1/3" isNoPadding={true}>
                <Heading
                    size="medium"
                    isCentered={true}
                    isNoMargin={true}
                >
                    873,435
                </Heading>

                <Paragraph
                    isMuted={0.4}
                    isCentered={true}
                    isNoMargin={true}
                >
                    Number of transactions
                </Paragraph>
            </Column>

            <Column colWidth="1/3" isNoPadding={true}>
                <Heading
                    size="medium"
                    isCentered={true}
                    isNoMargin={true}
                >
                    $203M
                </Heading>

                <Paragraph
                    isMuted={0.4}
                    isCentered={true}
                    isNoMargin={true}
                >
                    Total volume
                </Paragraph>
            </Column>

            <Column colWidth="1/3" isNoPadding={true}>
                <Heading
                    size="medium"
                    isCentered={true}
                    isNoMargin={true}
                >
                    227,372
                </Heading>

                <Paragraph
                    isMuted={0.4}
                    isCentered={true}
                    isNoMargin={true}
                >
                    Number of relayers
                </Paragraph>
            </Column>
        </Wrap>
    </Section>
);
