import * as React from 'react';
import {Button, ButtonWrap, Link} from 'ts/@next/components/button';
import {Icon, InlineIconWrap} from 'ts/@next/components/icon';
import {Column, Section, Wrap, WrapCentered, WrapGrid} from 'ts/@next/components/layout';
import {Heading, Paragraph} from 'ts/@next/components/text';

export const SectionLandingCta = () => (
    <Section>
        <Wrap>
            <Column
                bgColor="#003831"
                colWidth="1/2"
                isPadLarge={true}
            >
                <WrapCentered>
                    <Icon
                        name="ready-to-build"
                        size="large"
                        margin={[0, 0, 'default', 0]}
                    />

                    <Paragraph size="medium" color="#00AE99" marginBottom="15px">
                        Ready to build on 0x?
                    </Paragraph>

                    <Link
                        href="#"
                        isTransparent={true}
                        isWithArrow={true}
                    >
                        Get Started
                    </Link>
                </WrapCentered>
            </Column>

            <Column
                bgColor="#003831"
                colWidth="1/2"
                isPadLarge={true}
            >
                <WrapCentered>
                    <Icon
                        name="ready-to-build"
                        size="large"
                        margin={[0, 0, 'default', 0]}
                    />

                    <Paragraph size="medium" color="#00AE99" marginBottom="15px">
                        Want help from the 0x team?
                    </Paragraph>

                    <Link
                        href="#"
                        isTransparent={true}
                        isWithArrow={true}
                    >
                        Get in Touch
                    </Link>
                </WrapCentered>
            </Column>
        </Wrap>
    </Section>
);
