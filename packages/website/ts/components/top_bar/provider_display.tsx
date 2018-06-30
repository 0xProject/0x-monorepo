import { Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import RaisedButton from 'material-ui/RaisedButton';
import ActionAccountBalanceWallet from 'material-ui/svg-icons/action/account-balance-wallet';
import Lock from 'material-ui/svg-icons/action/lock';
import * as React from 'react';

import { Blockchain } from 'ts/blockchain';
import { InstallPrompt } from 'ts/components/top_bar/install_prompt';
import { ProviderPicker } from 'ts/components/top_bar/provider_picker';
import { AccountConnection } from 'ts/components/ui/account_connection';
import { Container } from 'ts/components/ui/container';
import { DropDown } from 'ts/components/ui/drop_down';
import { Identicon } from 'ts/components/ui/identicon';
import { Island } from 'ts/components/ui/island';
import { Text } from 'ts/components/ui/text';
import { Dispatcher } from 'ts/redux/dispatcher';
import { colors } from 'ts/style/colors';
import { AccountState, ProviderType } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

const ROOT_HEIGHT = 24;

export interface ProviderDisplayProps {
    dispatcher: Dispatcher;
    userAddress: string;
    networkId: number;
    injectedProviderName: string;
    providerType: ProviderType;
    onToggleLedgerDialog: () => void;
    blockchain?: Blockchain;
    blockchainIsLoaded: boolean;
}

interface ProviderDisplayState {}

const styles: Styles = {
    root: {
        height: ROOT_HEIGHT,
        borderRadius: ROOT_HEIGHT,
    },
};

export class ProviderDisplay extends React.Component<ProviderDisplayProps, ProviderDisplayState> {
    public render(): React.ReactNode {
        const isExternallyInjectedProvider = utils.isExternallyInjected(
            this.props.providerType,
            this.props.injectedProviderName,
        );
        const hoverActiveNode = (
            <Island className="flex items-center py1 px2" style={styles.root}>
                {this._renderIcon()}
                <Container marginLeft="12px" marginRight="12px">
                    {this._renderDisplayMessage()}
                </Container>
                {this._renderInjectedProvider()}
            </Island>
        );
        const hasLedgerProvider = this.props.providerType === ProviderType.Ledger;
        const horizontalPosition = isExternallyInjectedProvider || hasLedgerProvider ? 'left' : 'middle';
        return (
            <div style={{ width: 'fit-content', height: 48, float: 'right' }}>
                <DropDown
                    hoverActiveNode={hoverActiveNode}
                    popoverContent={this.renderPopoverContent(isExternallyInjectedProvider, hasLedgerProvider)}
                    anchorOrigin={{ horizontal: horizontalPosition, vertical: 'bottom' }}
                    targetOrigin={{ horizontal: horizontalPosition, vertical: 'top' }}
                    zDepth={1}
                />
            </div>
        );
    }
    public renderPopoverContent(hasInjectedProvider: boolean, hasLedgerProvider: boolean): React.ReactNode {
        const accountState = this._getAccountState();
        switch (accountState) {
            case AccountState.Ready:
            case AccountState.Locked:
                return (
                    <ProviderPicker
                        dispatcher={this.props.dispatcher}
                        networkId={this.props.networkId}
                        injectedProviderName={this.props.injectedProviderName}
                        providerType={this.props.providerType}
                        onToggleLedgerDialog={this.props.onToggleLedgerDialog}
                        blockchain={this.props.blockchain}
                    />
                );
            case AccountState.Disconnected:
                return <InstallPrompt onToggleLedgerDialog={this.props.onToggleLedgerDialog} />;
            case AccountState.Loading:
            default:
                return null;
        }
    }
    private _renderIcon(): React.ReactNode {
        const accountState = this._getAccountState();
        switch (accountState) {
            case AccountState.Ready:
                return <Identicon address={this.props.userAddress} diameter={ROOT_HEIGHT} />;
            case AccountState.Loading:
                return <CircularProgress size={ROOT_HEIGHT} thickness={2} />;
            case AccountState.Locked:
                return <Lock color={colors.black} />;
            case AccountState.Disconnected:
                return <ActionAccountBalanceWallet color={colors.mediumBlue} />;
            default:
                return null;
        }
    }
    private _renderDisplayMessage(): React.ReactNode {
        const accountState = this._getAccountState();
        const displayMessage = utils.getReadableAccountState(accountState, this.props.userAddress);
        const fontColor = this._getDisplayMessageFontColor();
        return (
            <Text fontSize="16px" fontColor={fontColor} fontWeight={500}>
                {displayMessage}
            </Text>
        );
    }
    private _getDisplayMessageFontColor(): string {
        const accountState = this._getAccountState();
        switch (accountState) {
            case AccountState.Loading:
                return colors.darkGrey;
            case AccountState.Ready:
            case AccountState.Locked:
            case AccountState.Disconnected:
            default:
                return colors.black;
        }
    }
    private _renderInjectedProvider(): React.ReactNode {
        const accountState = this._getAccountState();
        switch (accountState) {
            case AccountState.Ready:
            case AccountState.Locked:
                return (
                    <AccountConnection
                        accountState={accountState}
                        injectedProviderName={this.props.injectedProviderName}
                    />
                );
            case AccountState.Disconnected:
            case AccountState.Loading:
            default:
                return null;
        }
    }
    private _isBlockchainReady(): boolean {
        return this.props.blockchainIsLoaded && !_.isUndefined(this.props.blockchain);
    }
    private _getAccountState(): AccountState {
        return utils.getAccountState(
            this._isBlockchainReady(),
            this.props.providerType,
            this.props.injectedProviderName,
            this.props.userAddress,
        );
    }
}
