import * as _ from 'lodash';
import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { ScreenWidths } from 'ts/types';

export interface FeatureProps {
    screenWidth: ScreenWidths;
}

export const Features = (props: FeatureProps) => (
    <Container backgroundColor={colors.instantSecondaryBackground} className="py3 flex flex-column px3">
        <FeatureItem
            imgSrc="images/instant/snt_screenshot.png"
            title="Support ERC-20 and ERC-721 tokens"
            description="Seamlessly integrate token purchasing into your product experience by offering digital assets ranging from in-game items to stablecoins."
            linkInfos={[
                {
                    displayText: 'Get started',
                    linkSrc: 'google.com',
                },
                {
                    displayText: 'Explore the docs',
                    linkSrc: 'google.com',
                },
            ]}
            screenWidth={props.screenWidth}
        />
        <FeatureItem
            imgSrc="images/instant/snt_screenshot.png"
            title="Generate revenue for your business"
            description="With just a few lines of code, you can earn up to 5% in affiliate fees on every transaction from your crypto wallet or dApp."
            linkInfos={[
                {
                    displayText: 'Learn about affiliate fees',
                    linkSrc: 'google.com',
                },
            ]}
            screenWidth={props.screenWidth}
        />
        <FeatureItem
            imgSrc="images/instant/snt_screenshot.png"
            title="Easy and Flexible Integration"
            description="Use our out-of-the-box design or customize the user interface by integrating the AssetBuyer engine. You can also tap into 0x networked liquidity or choose your own liquidity pool."
            linkInfos={[
                {
                    displayText: 'Explore AssetBuyer',
                    linkSrc: 'google.com',
                },
                {
                    displayText: 'Learn about liquidity',
                    linkSrc: 'google.com',
                },
            ]}
            screenWidth={props.screenWidth}
        />
    </Container>
);

interface LinkInfo {
    displayText: string;
    linkSrc: string;
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
    const isLargeScreen = screenWidth === ScreenWidths.Lg;
    const image = <Container backgroundColor={colors.instantPrimaryBackground} maxWidth="425px" maxHeight="225px" />;
    const info = (
        <Container maxWidth="500px">
            <Text fontSize="24px" lineHeight="34px" fontColor={colors.white} fontWeight={500}>
                {title}
            </Text>
            <Container marginTop="28px">
                <Text fontFamily="Roboto Mono" fontSize="14px" lineHeight="2em" fontColor={colors.grey500}>
                    {description}
                </Text>
            </Container>
            <Container className="flex" marginTop="28px">
                {_.map(linkInfos, linkInfo => {
                    const onClick = (event: React.MouseEvent<HTMLElement>) => {
                        window.open(linkInfo.linkSrc, '_blank');
                    };
                    return (
                        <Container className="flex items-center" marginRight="32px" onClick={onClick} cursor="pointer">
                            <Container>
                                <Text fontSize="16px" fontColor={colors.white}>
                                    {linkInfo.displayText}
                                </Text>
                            </Container>
                            <Container paddingTop="1px" paddingLeft="6px">
                                <i
                                    className="zmdi zmdi-chevron-right bold"
                                    style={{ fontSize: 16, color: colors.white }}
                                />
                            </Container>
                        </Container>
                    );
                })}
            </Container>
        </Container>
    );
    return (
        <Container className="flex flex-column items-center py4 px3">
            {isLargeScreen ? (
                <Container className="flex">
                    {image}
                    <Container marginLeft="115px">{info}</Container>
                </Container>
            ) : (
                <Container className="flex flex-column items-center">
                    {image}
                    <Container marginTop="32px">{info}</Container>
                </Container>
            )}
        </Container>
    );
};
