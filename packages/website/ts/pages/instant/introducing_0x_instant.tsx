import * as React from 'react';

import { Button } from 'ts/components/ui/button';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';

export const Introducing0xInstant = () => (
    <div className="clearfix center lg-pt4 md-pt4" style={{ backgroundColor: colors.instantPrimaryBackground }}>
        <div className="mx-auto inline-block align-middle py4" style={{ lineHeight: '44px', textAlign: 'center' }}>
            <Container className="sm-center sm-pt3">
                <Text
                    fontColor={colors.white}
                    fontSize="42px"
                    lineHeight="52px"
                    fontFamily="Roboto Mono"
                    fontWeight="600"
                >
                    Introducing 0x Instant
                </Text>
            </Container>
            <Container className="pb2 lg-pt2 md-pt2 sm-pt3 sm-px3 sm-center" maxWidth="600px">
                <Text fontColor={colors.grey500} fontSize="20px" lineHeight="32px" fontFamily="Roboto Mono">
                    A free and flexible way to offer simple crypto
                    <br /> purchasing in any app or website.
                </Text>
            </Container>
            <div className="py3">
                <Button
                    type="button"
                    backgroundColor={colors.mediumBlue}
                    fontColor={colors.white}
                    fontSize="18px"
                    fontFamily="Roboto Mono"
                >
                    Get Started
                </Button>
            </div>
        </div>
    </div>
);
