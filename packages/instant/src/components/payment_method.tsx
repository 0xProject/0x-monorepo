import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';
import { Account, AccountState, Network } from '../types';
import { envUtil } from '../util/env';

import { CoinbaseWalletLogo } from './coinbase_wallet_logo';
import { MetaMaskLogo } from './meta_mask_logo';
import { PaymentMethodDropdown } from './payment_method_dropdown';
import { SectionHeader } from './section_header';
import { Circle } from './ui/circle';
import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Icon } from './ui/icon';
import { Text } from './ui/text';
import { WalletPrompt } from './wallet_prompt';

export interface PaymentMethodProps {
    account: Account;
    network: Network;
    walletDisplayName: string;
    onInstallWalletClick: () => void;
    onUnlockWalletClick: () => void;
}

export class PaymentMethod extends React.PureComponent<PaymentMethodProps> {
    public render(): React.ReactNode {
        return (
            <Container width="100%" height="120px" padding="20px 20px 0px 20px">
                <Container marginBottom="12px">
                    <Flex justify="space-between">
                        <SectionHeader>{this._renderTitleText()}</SectionHeader>
                        {this._renderTitleLabel()}
                    </Flex>
                </Container>
                {this._renderMainContent()}
            </Container>
        );
    }
    private readonly _renderTitleText = (): string => {
        const { account } = this.props;
        switch (account.state) {
            case AccountState.Loading:
                return 'loading...';
            case AccountState.Locked:
            case AccountState.None:
                return 'connect your wallet';
            case AccountState.Ready:
                return 'payment method';
        }
    };
    private readonly _renderTitleLabel = (): React.ReactNode => {
        const { account } = this.props;
        if (account.state === AccountState.Ready || account.state === AccountState.Locked) {
            const circleColor: ColorOption = account.state === AccountState.Ready ? ColorOption.green : ColorOption.red;
            return (
                <Flex align="center">
                    <Circle diameter={8} color={circleColor} />
                    <Container marginLeft="5px">
                        <Text fontColor={ColorOption.darkGrey} fontSize="12px" lineHeight="30px">
                            {this.props.walletDisplayName}
                        </Text>
                    </Container>
                </Flex>
            );
        }
        return null;
    };
    private readonly _renderMainContent = (): React.ReactNode => {
        const { account, network } = this.props;
        const isMobile = envUtil.isMobileOperatingSystem();
        const logo = isMobile ? <CoinbaseWalletLogo width={22} /> : <MetaMaskLogo width={19} height={18} />;
        const primaryColor = isMobile ? ColorOption.darkBlue : ColorOption.darkOrange;
        const secondaryColor = isMobile ? ColorOption.lightBlue : ColorOption.lightOrange;
        const colors = { primaryColor, secondaryColor };
        switch (account.state) {
            case AccountState.Loading:
                return null;
            case AccountState.Locked:
                return (
                    <WalletPrompt
                        onClick={this.props.onUnlockWalletClick}
                        image={
                            <Container position="relative" top="2px">
                                <Icon width={13} icon="lock" color={ColorOption.black} />
                            </Container>
                        }
                        {...colors}
                    >
                        Click to Connect {this.props.walletDisplayName}
                    </WalletPrompt>
                );
            case AccountState.None:
                return (
                    <WalletPrompt onClick={this.props.onInstallWalletClick} image={logo} {...colors}>
                        {isMobile ? 'Install Coinbase Wallet' : 'Install MetaMask'}
                    </WalletPrompt>
                );
            case AccountState.Ready:
                return (
                    <PaymentMethodDropdown
                        accountAddress={account.address}
                        accountEthBalanceInWei={account.ethBalanceInWei}
                        network={network}
                    />
                );
        }
    };
}
