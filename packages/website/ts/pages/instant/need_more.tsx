import * as React from 'react';

import { Button } from 'ts/components/ui/button';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { ScreenWidths } from 'ts/types';

export interface NeedMoreProps {
    screenWidth: ScreenWidths;
}
export const NeedMore = (props: NeedMoreProps) => {
    const isSmallScreen = props.screenWidth === ScreenWidths.Sm;
    const className = isSmallScreen ? 'flex flex-column items-center' : 'flex';
    const marginRight = isSmallScreen ? undefined : '200px';
    return (
        <Container
            className="flex flex-column items-center py4 px3"
            backgroundColor={colors.instantSecondaryBackground}
        >
            <Container className={className}>
                <Container className="sm-center" marginRight={marginRight}>
                    <Text fontColor={colors.white} fontSize="32px" lineHeight="45px">
                        Need more flexibility?
                    </Text>
                    <Text fontColor={colors.grey500} fontSize="18px" lineHeight="27px">
                        View our full documentation or reach out if you have any questions.
                    </Text>
                </Container>
                <Container className="py3 flex">
                    <Container marginRight="20px">
                        <Button
                            type="button"
                            backgroundColor={colors.white}
                            fontColor={colors.instantSecondaryBackground}
                            fontSize="18px"
                        >
                            Get in Touch
                        </Button>
                    </Container>
                    <Button type="button" backgroundColor={colors.mediumBlue} fontColor={colors.white} fontSize="18px">
                        Explore the Docs
                    </Button>
                </Container>
            </Container>
        </Container>
    );
};
