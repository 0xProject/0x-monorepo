import { colors } from '@0x/react-shared';
import { BigNumber } from '@0x/utils';
import * as React from 'react';
import { Balance } from 'ts/components/ui/balance';
import { Container } from 'ts/components/ui/container';
import { IconButton } from 'ts/components/ui/icon_button';
import { Text } from 'ts/components/ui/text';
import { constants } from 'ts/utils/constants';

export interface WrapEthOnboardingStep1Props {}

export const WrapEthOnboardingStep1: React.StatelessComponent<WrapEthOnboardingStep1Props> = () => (
    <div className="flex items-center flex-column">
        <Text>
            You need to convert some of your ETH into tradeable <b>Wrapped ETH (WETH)</b>.
        </Text>
        <Container width="100%" marginTop="25px" marginBottom="15px" className="flex justify-center">
            <div className="flex flex-column items-center">
                <Text fontWeight={700}> 1 ETH </Text>
                <img src="/images/eth_dollar.svg" height="75px" width="75x" />
            </div>
            <Container marginRight="25px" marginLeft="25px" position="relative" top="20px">
                <Text fontSize="36px">=</Text>
            </Container>
            <div className="flex flex-column items-center">
                <Text fontWeight={700}> 1 WETH </Text>
                <img src="/images/eth_token_erc20.svg" height="75px" width="75px" />
            </div>
        </Container>
        <Text>
            Think of it like the coin version of a paper note. It has the same value, but some machines only take coins.
        </Text>
    </div>
);

export interface WrapEthOnboardingStep2Props {}

export const WrapEthOnboardingStep2: React.StatelessComponent<WrapEthOnboardingStep2Props> = () => (
    <div className="flex items-center flex-column">
        <Text>Wrapping your ETH is a reversable transaction, so don't worry about losing your ETH.</Text>
        <Text>
            Click
            <Container display="inline-block" marginLeft="10px" marginRight="10px">
                <IconButton
                    iconName="zmdi-long-arrow-down"
                    color={colors.mediumBlue}
                    labelText="wrap"
                    display="inline-flex"
                />
            </Container>
            to wrap your ETH.
        </Text>
    </div>
);

export interface WrapEthOnboardingStep3Props {
    wethAmount: BigNumber;
}

export const WrapEthOnboardingStep3: React.StatelessComponent<WrapEthOnboardingStep3Props> = ({ wethAmount }) => (
    <div className="flex items-center flex-column">
        <Text>
            You have{' '}
            <Balance
                amount={wethAmount}
                decimals={constants.DECIMAL_PLACES_ETH}
                symbol={constants.ETHER_TOKEN_SYMBOL}
            />{' '}
            in your wallet.
            {wethAmount.gt(0) && ' Great!'}
        </Text>
        <Container width="100%" marginTop="25px" marginBottom="15px" className="flex justify-center">
            <div className="flex flex-column items-center">
                <Text fontWeight={700}> 1 ETH </Text>
                <img src="/images/eth_dollar.svg" height="75px" width="75x" />
            </div>
            <Container marginRight="25px" marginLeft="25px" position="relative" top="20px">
                <Text fontSize="25px">
                    <i className="zmdi zmdi-long-arrow-right" />
                </Text>
            </Container>
            <div className="flex flex-column items-center">
                <Text fontWeight={700}> 1 WETH </Text>
                <img src="/images/eth_token_erc20.svg" height="75px" width="75px" />
            </div>
        </Container>
    </div>
);
