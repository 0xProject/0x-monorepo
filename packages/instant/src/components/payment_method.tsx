import * as React from 'react';

import PhoneIconSvg from '../assets/icons/phone.svg';
import { ColorOption } from '../style/theme';
import { Account, AccountState, Network, ProviderType } from '../types';
import { envUtil } from '../util/env';

import { CoinbaseWalletLogo } from './coinbase_wallet_logo';
import { MetaMaskLogo } from './meta_mask_logo';
import { PaymentMethodDropdown } from './payment_method_dropdown';
import { SectionHeader } from './section_header';
import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { WalletPrompt } from './wallet_prompt';

export interface PaymentMethodProps {
    account: Account;
    network: Network;
    walletDisplayName: string;
    onInstallWalletClick: () => void;
    onUnlockWalletClick: (providerType: ProviderType) => void;
}

export class PaymentMethod extends React.PureComponent<PaymentMethodProps> {
    public render(): React.ReactNode {
        const marginBottom = this.props.account.state !== AccountState.Ready ? '77px' : null;
        return (
            <Container width="100%" height="100%" padding="20px 20px 0px 20px" marginBottom={marginBottom}>
                <Container marginBottom="12px">
                    <Flex justify="space-between">
                        <SectionHeader>{this._renderTitleText()}</SectionHeader>
                    </Flex>
                </Container>
                <Container>{this._renderMainContent()}</Container>
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
    private readonly _renderMainContent = (): React.ReactNode => {
        const { account, network } = this.props;
        const isMobile = envUtil.isMobileOperatingSystem();
        const metamaskLogo = <MetaMaskLogo width={23} height={22} />;
        const logo = isMobile ? <CoinbaseWalletLogo width={22} height={22} /> : metamaskLogo;
        const primaryColor = ColorOption.grey;
        const secondaryColor = ColorOption.whiteBackground;
        const colors = { primaryColor, secondaryColor };
        const onUnlockGenericWallet = () => {
            this.props.onUnlockWalletClick(ProviderType.MetaMask);
        };
        const onUnlockFormatic = () => this.props.onUnlockWalletClick(ProviderType.Fortmatic);
        switch (account.state) {
            case AccountState.Loading:
                return null;
            case AccountState.Locked:
                return (
                    <Flex direction="column">
                        <WalletPrompt
                            onClick={onUnlockGenericWallet}
                            display="flex"
                            alignText={'flex-start'}
                            marginLeft="16px"
                            fontWeight="normal"
                            padding="15px 18px"
                            image={
                                <Container position="relative" display="flex">
                                    {logo}
                                </Container>
                            }
                            {...colors}
                        >
                            {isMobile ? 'Coinbase Wallet' : 'MetaMask'}
                        </WalletPrompt>
                        <WalletPrompt
                            onClick={onUnlockFormatic}
                            marginTop="14px"
                            marginLeft="19px"
                            fontWeight="normal"
                            padding="15px 18px"
                            image={
                                <Container position="relative" display="flex">
                                    <PhoneIconSvg />
                                </Container>
                            }
                            display="flex"
                            {...colors}
                        >
                            Use phone number
                        </WalletPrompt>
                    </Flex>
                );
            case AccountState.None:
                return (
                    <Flex direction="column" justify="space-between" height="100%">
                        <WalletPrompt
                            onClick={this.props.onInstallWalletClick}
                            image={logo}
                            {...colors}
                            fontWeight="normal"
                            marginLeft="19px"
                            padding="15px 18px"
                        >
                            {isMobile ? 'Install Coinbase Wallet' : 'Install MetaMask'}
                        </WalletPrompt>
                        <WalletPrompt
                            onClick={onUnlockFormatic}
                            marginTop="14px"
                            fontWeight="normal"
                            marginLeft="19px"
                            padding="15px 18px"
                            image={
                                <Container position="relative" display="flex">
                                    <PhoneIconSvg />
                                </Container>
                            }
                            display="flex"
                            {...colors}
                        >
                            Use phone number
                        </WalletPrompt>
                    </Flex>
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
