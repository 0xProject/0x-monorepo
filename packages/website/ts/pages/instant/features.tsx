import * as _ from 'lodash';
import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { ActionLink, ActionLinkProps } from 'ts/pages/instant/action_link';
import { Image } from 'ts/components/ui/image';
import { Text } from 'ts/components/ui/text';
import { colors } from 'ts/style/colors';
import { ScreenWidths } from 'ts/types';
import { utils } from 'ts/utils/utils';

export interface FeatureProps {
    screenWidth: ScreenWidths;
    onGetStartedClick: () => void;
}

export const Features = (props: FeatureProps) => {
    const isSmallScreen = props.screenWidth === ScreenWidths.Sm;
    const getStartedLinkInfo = {
        displayText: 'Get started',
        onClick: props.onGetStartedClick,
    };
    const exploreTheDocsLinkInfo = {
        displayText: 'Explore the docs',
        linkSrc: `${utils.getCurrentBaseUrl()}/wiki#Get-Started`,
    };
    const tokenLinkInfos = isSmallScreen ? [getStartedLinkInfo] : [getStartedLinkInfo, exploreTheDocsLinkInfo];
    return (
        <Container backgroundColor={colors.instantSecondaryBackground} className="py3 flex flex-column px3">
            <FeatureItem
                imgSrc="images/instant/feature_1.svg"
                title="Support ERC-20 and ERC-721 tokens"
                description="Seamlessly integrate token purchasing into your product experience by offering digital assets ranging from in-game items to stablecoins."
                linkInfos={tokenLinkInfos}
                screenWidth={props.screenWidth}
            />
            <FeatureItem
                imgSrc="images/instant/feature_2.svg"
                title="Generate revenue for your business"
                description="With just a few lines of code, you can earn up to 5% in affiliate fees on every transaction from your crypto wallet or dApp."
                linkInfos={[
                    {
                        displayText: 'Learn about affiliate fees',
                        linkSrc: `${utils.getCurrentBaseUrl()}/wiki#Learn-About-Affiliate-Fees`,
                    },
                ]}
                screenWidth={props.screenWidth}
            />
            <FeatureItem
                imgSrc="images/instant/feature_3.svg"
                title="Easy and Flexible Integration"
                description="Use our out-of-the-box design or customize the user interface by integrating the AssetBuyer engine. You can also tap into 0x networked liquidity or choose your own liquidity pool."
                linkInfos={[
                    {
                        displayText: 'Explore AssetBuyer',
                        linkSrc: `${utils.getCurrentBaseUrl()}/docs/asset-buyer`,
                    },
                ]}
                screenWidth={props.screenWidth}
            />
        </Container>
    );
};

interface FeatureItemProps {
    imgSrc: string;
    title: string;
    description: string;
    linkInfos: ActionLinkProps[];
    screenWidth: ScreenWidths;
}

const FeatureItem = (props: FeatureItemProps) => {
    const { imgSrc, title, description, linkInfos, screenWidth } = props;
    const isLargeScreen = screenWidth === ScreenWidths.Lg;
    const maxWidth = isLargeScreen ? '500px' : undefined;
    const image = (
        <Container className="center" minWidth="435px" maxHeight="225px">
            <Image src={imgSrc} additionalStyle={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,.25))' }} />
        </Container>
    );
    const info = (
        <Container maxWidth={maxWidth}>
            <Text fontSize="24px" lineHeight="34px" fontColor={colors.white} fontWeight={500}>
                {title}
            </Text>
            <Container marginTop="28px">
                <Text fontFamily="Roboto Mono" fontSize="14px" lineHeight="2em" fontColor={colors.grey500}>
                    {description}
                </Text>
            </Container>
            <Container className="flex" marginTop="28px">
                {_.map(linkInfos, linkInfo => <ActionLink key={linkInfo.displayText} {...linkInfo} />)}
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
                <Container className="flex flex-column items-center" width="100%">
                    {image}
                    <Container marginTop="48px">{info}</Container>
                </Container>
            )}
        </Container>
    );
};
