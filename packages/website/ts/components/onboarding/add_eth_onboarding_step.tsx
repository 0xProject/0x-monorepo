import { BigNumber } from '@0x/utils';
import * as React from 'react';
import { Balance } from 'ts/components/ui/balance';
import { Container } from 'ts/components/ui/container';
import { Image } from 'ts/components/ui/image';
import { Text } from 'ts/components/ui/text';
import { constants } from 'ts/utils/constants';

export interface AddEthOnboardingStepProps {
    userEthBalanceInWei: BigNumber;
}

export const AddEthOnboardingStep: React.StatelessComponent<AddEthOnboardingStepProps> = props =>
    props.userEthBalanceInWei.gt(0) ? (
        <div className="flex items-center flex-column">
            <Text>
                Great! Looks like you already have{' '}
                <Balance
                    amount={props.userEthBalanceInWei}
                    decimals={constants.DECIMAL_PLACES_ETH}
                    symbol={constants.ETHER_SYMBOL}
                />{' '}
                in your wallet.
            </Text>
            <Container marginTop="15px" marginBottom="15px">
                <Image src="/images/ether_alt.svg" height="50px" width="50px" />
            </Container>
        </div>
    ) : (
        <div className="flex items-center flex-column">
            <Text> Before you begin you will need to send some ETH to your wallet.</Text>
            <Container marginTop="15px" marginBottom="15px">
                <Image src="/images/ether_alt.svg" height="50px" width="50px" />
            </Container>
            <Text className="xs-hide">
                Click on the <Image src="/images/metamask_icon.png" height="20px" width="20px" /> MetaMask extension in
                your browser and click either <b>BUY</b> or <b>DEPOSIT</b>.
            </Text>
        </div>
    );
