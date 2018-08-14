import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { Image } from 'ts/components/ui/image';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { ScreenWidths } from 'ts/types';

export interface MissionProps {
    screenWidth: ScreenWidths;
}
export const Mission = (props: MissionProps) => {
    const shouldShowImage = props.screenWidth === ScreenWidths.Lg;
    const image = <Image src="/images/jobs/world-map.svg" maxWidth="500px" maxHeight="280px" />;
    const missionStatementClassName = !shouldShowImage ? 'center' : undefined;
    const missionStatement = (
        <Container className={missionStatementClassName} maxWidth="388px">
            <Text fontFamily="Roboto Mono" fontSize="22px" lineHeight="31px">
                Powered by a Diverse<br />Worldwide Community
            </Text>
            <Container marginTop="32px">
                <Text fontSize="14px" lineHeight="2em">
                    We're a highly technical team with varied backgrounds in engineering, science, business, finance,
                    and research. While the core team is headquartered in San Francisco, there are 30+ teams building on
                    0x and hundreds of thousands of participants behind our efforts globally. We're passionate about
                    open-source software and decentralized technology's potential to act as an equalizing force in the
                    world.
                </Text>
            </Container>
        </Container>
    );
    return (
        <div
            className="flex flex-column items-center py4 px3"
            style={{ backgroundColor: colors.jobsPageBackground, color: colors.black }}
        >
            {shouldShowImage ? (
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
