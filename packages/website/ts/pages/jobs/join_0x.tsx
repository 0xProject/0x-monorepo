import { colors } from '@0x/react-shared';

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
                    At 0x, our mission is to create a tokenized world where all value can flow freely.
                    <br />
                    <br />We are powering a growing ecosystem of decentralized applications and solving novel challenges
                    to make our technology intuitive, flexible, and accessible to all.{' '}
                    <a
                        style={{ color: colors.mediumBlue, textDecoration: 'none' }}
                        target="_blank"
                        href={constants.URL_MISSION_AND_VALUES_BLOG_POST}
                    >
                        Read more
                    </a>{' '}
                    about our mission, and join us in building financial infrastructure upon which the exchange of
                    anything of value will take place.
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
