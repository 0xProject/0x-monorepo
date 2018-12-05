import * as React from 'react';

import { Button } from 'ts/components/ui/button';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { ScreenWidths, WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

export interface NeedMoreProps {
    screenWidth: ScreenWidths;
}
export const NeedMore = (props: NeedMoreProps) => {
    const isSmallScreen = props.screenWidth === ScreenWidths.Sm;
    const backgroundColor = isSmallScreen ? colors.instantTertiaryBackground : colors.instantSecondaryBackground;
    const className = isSmallScreen ? 'flex flex-column items-center' : 'flex';
    const marginRight = isSmallScreen ? undefined : '200px';
    return (
        <Container className="flex flex-column items-center py4 px3" backgroundColor={backgroundColor}>
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
                            fontColor={backgroundColor}
                            fontSize="18px"
                            onClick={onGetInTouchClick}
                        >
                            Get in Touch
                        </Button>
                    </Container>
                    <Button
                        type="button"
                        backgroundColor={colors.mediumBlue}
                        fontColor={colors.white}
                        fontSize="18px"
                        onClick={onDocsClick}
                    >
                        Explore the Docs
                    </Button>
                </Container>
            </Container>
        </Container>
    );
};

const onGetInTouchClick = () => {
    utils.openUrl(constants.URL_ZEROEX_CHAT);
};
const onDocsClick = () => {
    utils.openUrl(`${WebsitePaths.Wiki}#Get-Started-With-Instant`);
};
