import { colors } from '@0x/react-shared';
import * as React from 'react';
import { Container } from 'ts/components/ui/container';
import { Image } from 'ts/components/ui/image';
import { Text } from 'ts/components/ui/text';
import { utils } from 'ts/utils/utils';

export interface InstallWalletOnboardingStepProps {}

export const InstallWalletOnboardingStep: React.StatelessComponent<InstallWalletOnboardingStepProps> = () => {
    const [downloadLink, isOnMobile] = utils.getBestWalletDownloadLinkAndIsMobile();
    const followupText = isOnMobile
        ? `Please revisit this site in your mobile dApp browser to continue!`
        : `Please refresh the page once you've done this to continue!`;
    const downloadText = isOnMobile ? 'Get Coinbase Wallet' : 'Get the MetaMask extension';
    return (
        <div className="flex items-center flex-column">
            <Text>First, you need to connect to a wallet. This will be used across all 0x relayers and dApps.</Text>
            <Container className="flex items-center" marginTop="15px" marginBottom="15px">
                <Image
                    height="50px"
                    width="50px"
                    borderRadius="22%"
                    src={isOnMobile ? '/images/coinbase_wallet_logo.png' : '/images/metamask_icon.png'}
                />
                <Container marginLeft="10px">
                    <a href={downloadLink} target="_blank">
                        <Text
                            fontWeight={700}
                            fontSize="18px"
                            fontColor={colors.mediumBlue}
                            textDecorationLine="underline"
                        >
                            {downloadText}
                        </Text>
                    </a>
                </Container>
            </Container>
            <Text>{followupText}</Text>
        </div>
    );
};
