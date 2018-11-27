import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { Image } from 'ts/components/ui/image';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { ScreenWidths } from 'ts/types';

export const Features = () => (
    <Container backgroundColor={colors.instantBackground} className="py3 flex justify-center">
        <img className="px1" width="300px" height="420px" src="images/instant/snt_screenshot.png" />
        <img className="px1" width="300px" height="420px" src="images/instant/omg_screenshot.png" />
        <img className="px1" width="300px" height="420px" src="images/instant/kitty_screenshot.png" />
        <img className="px1" width="300px" height="420px" src="images/instant/bat_screenshot.png" />
        <img className="px1" width="300px" height="420px" src="images/instant/leroy_screenshot.png" />
        <img className="px1" width="300px" height="420px" src="images/instant/mkr_screenshot.png" />
    </Container>
);

interface LinkInfo {
    linkSrc: string;
    displayText: string;
}

interface FeatureItemProps {
    imgSrc: string;
    title: string;
    description: string;
    linkInfos: LinkInfo[];
    screenWidth: ScreenWidths;
}

const FeatureItem = (props: FeatureItemProps) => {
    const { imgSrc, title, description, linkInfos, screenWidth } = props;
    const shouldShowImage = screenWidth === ScreenWidths.Lg;
    const image = <Image src={imgSrc} maxWidth="500px" maxHeight="280px" />;
    const missionStatementClassName = !shouldShowImage ? 'center' : undefined;
    const missionStatement = (
        <Container className={missionStatementClassName} maxWidth="388px">
            <Text fontFamily="Roboto Mono" fontSize="22px" lineHeight="31px">
                {title}
            </Text>
            <Container marginTop="32px">
                <Text fontSize="14px" lineHeight="2em">
                    {description}
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
