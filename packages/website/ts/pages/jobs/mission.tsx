import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { ScreenWidths } from 'ts/types';

export interface MissionProps {
    screenWidth: ScreenWidths;
}
export const Mission = (props: MissionProps) => {
    const isSmallScreen = props.screenWidth === ScreenWidths.Sm;
    const image = <img src="/images/jobs/world-map.svg" style={{ maxWidth: 500, maxHeight: 280 }} />;
    const missionStatementClassName = isSmallScreen ? 'center' : undefined;
    const missionStatement = (
        <Container className={missionStatementClassName} maxWidth="388px">
            <Text fontFamily="Roboto Mono" fontSize="22px" lineHeight="31px">
                Globally Distributed<br />Purposefully Aligned
            </Text>
            <Container marginTop="32px">
                <Text fontSize="14px" lineHeight="2em">
                    We’re a highly technical team with diverse backgrounds in engineering, science, business, finance,
                    and research. While headquartered in San Francisco, we’ve designed our workflows to empower
                    teammates to stay informed and execute on their objectives from anywhere in the world. If you’re
                    passionate about our mission, we’re excited to talk to you, regardless of where you might live.
                </Text>
            </Container>
        </Container>
    );
    return (
        <div
            className="flex flex-column items-center py4 sm-px3"
            style={{ backgroundColor: colors.jobsPageBackground, color: colors.black }}
        >
            {!isSmallScreen ? (
                <Container className="flex items-center" maxWidth="1200px">
                    {image}
                    <Container marginLeft="115px">{missionStatement}</Container>
                </Container>
            ) : (
                <Container className="flex flex-column items-center">{missionStatement}</Container>
            )}
        </div>
    );
};
