import { colors } from '@0xproject/react-shared';

import * as React from 'react';

import { Button } from 'ts/components/ui/button';
import { Container } from 'ts/components/ui/container';
import { Image } from 'ts/components/ui/image';
import { Text } from 'ts/components/ui/text';
import { constants } from 'ts/utils/constants';

const BUTTON_TEXT = 'View open positions';

export interface Join0xProps {
    onCallToActionClick: () => void;
}

export const Join0x = (props: Join0xProps) => (
    <div className="clearfix center lg-py4 md-py4" style={{ backgroundColor: colors.white, color: colors.black }}>
        <div
            className="mx-auto inline-block align-middle py4"
            style={{ lineHeight: '44px', textAlign: 'center', position: 'relative' }}
        >
            <Container className="sm-hide xs-hide" position="absolute" left="100%" marginLeft="80px">
                <Image src="images/jobs/hero-dots-right.svg" width="400px" />
            </Container>
            <Container className="sm-hide xs-hide" position="absolute" right="100%" marginRight="80px">
                <Image src="images/jobs/hero-dots-left.svg" width="400px" />
            </Container>
            <div className="h2 sm-center sm-pt3" style={{ fontFamily: 'Roboto Mono' }}>
                Join Us in Our Mission
            </div>
            <Container className="pb2 lg-pt2 md-pt2 sm-pt3 sm-px3 sm-center" maxWidth="537px">
                <Text fontSize="14px" lineHeight="30px">
                    0x exists to create a tokenized world where all value can flow freely.<br />
                    <br />This means leaving the geographic lottery behind and democratizing access to financial
                    services globally. This means powering a growing ecosystem of next-generation decentralized apps.
                    And along the way, this requires solving novel challenges to make our tech intuitive, flexible, and
                    accessible to all.<br />
                    <br />
                    <a
                        style={{ color: colors.mediumBlue, textDecoration: 'none' }}
                        target="_blank"
                        href={constants.URL_MISSION_AND_VALUES_BLOG_POST}
                    >
                        Read more about our mission
                    </a>, and join us in building the rails upon which the exchange of any blockchain-based digital
                    assets take place.
                </Text>
            </Container>
            <div className="py3">
                <Button
                    type="button"
                    backgroundColor={colors.black}
                    width="290px"
                    fontColor={colors.white}
                    fontSize="18px"
                    fontFamily="Roboto Mono"
                    onClick={props.onCallToActionClick}
                >
                    {BUTTON_TEXT}
                </Button>
            </div>
        </div>
    </div>
);
