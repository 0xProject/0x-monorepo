import { Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';

import { Blockchain } from 'ts/blockchain';
import { ProviderPicker } from 'ts/components/top_bar/provider_picker';
import { Container } from 'ts/components/ui/container';
import { DropDown } from 'ts/components/ui/drop_down';
import { Identicon } from 'ts/components/ui/identicon';
import { Image } from 'ts/components/ui/image';
import { Island } from 'ts/components/ui/island';
import { Text } from 'ts/components/ui/text';
import { Dispatcher } from 'ts/redux/dispatcher';
import { colors } from 'ts/style/colors';
import { ProviderType } from 'ts/types';
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
        const displayMessage = utils.getReadableAccountState(
            this._isBlockchainReady(),
            this.props.providerType,
            this.props.injectedProviderName,
            this.props.userAddress,
        );
        // If the "injected" provider is our fallback public node, then we want to
        // show the "connect a wallet" message instead of the providerName
        const injectedProviderName = isExternallyInjectedProvider
            ? this.props.injectedProviderName
            : 'Connect a wallet';
        const providerTitle =
            this.props.providerType === ProviderType.Injected ? injectedProviderName : 'Ledger Nano S';
        const isProviderMetamask = providerTitle === constants.PROVIDER_NAME_METAMASK;
        const hoverActiveNode = (
            <Island className="flex items-center p1" style={styles.root}>
                <div>
                    {this._isBlockchainReady() ? (
                        <Identicon address={this.props.userAddress} diameter={ROOT_HEIGHT} />
                    ) : (
                        <CircularProgress size={ROOT_HEIGHT} thickness={2} />
                    )}
                </div>
                <Container marginLeft="12px" marginRight="12px">
                    <Text fontSize="14px" fontColor={colors.darkGrey}>
                        {displayMessage}
                    </Text>
                </Container>
                {isProviderMetamask && (
                    <Image src="/images/metamask_icon.png" height={ROOT_HEIGHT} width={ROOT_HEIGHT} />
                )}
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
        if (!this._isBlockchainReady()) {
            return null;
        } else if (hasInjectedProvider || hasLedgerProvider) {
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
        } else {
            // Nothing to connect to, show install/info popover
            return (
                <div className="px2" style={{ maxWidth: 420 }}>
                    <div className="center h4 py2" style={{ color: colors.grey700 }}>
                        Choose a wallet:
                    </div>
                    <div className="flex pb3">
                        <div className="center px2">
                            <div style={{ color: colors.darkGrey }}>Install a browser wallet</div>
                            <div className="py2">
                                <img src="/images/metamask_or_parity.png" width="135" />
                            </div>
                            <div>
                                Use{' '}
                                <a
                                    href={constants.URL_METAMASK_CHROME_STORE}
                                    target="_blank"
                                    style={{ color: colors.lightBlueA700 }}
                                >
                                    Metamask
                                </a>{' '}
                                or{' '}
                                <a
                                    href={constants.URL_PARITY_CHROME_STORE}
                                    target="_blank"
                                    style={{ color: colors.lightBlueA700 }}
                                >
                                    Parity Signer
                                </a>
                            </div>
                        </div>
                        <div>
                            <div
                                className="pl1 ml1"
                                style={{ borderLeft: `1px solid ${colors.grey300}`, height: 65 }}
                            />
                            <div className="py1">or</div>
                            <div
                                className="pl1 ml1"
                                style={{ borderLeft: `1px solid ${colors.grey300}`, height: 68 }}
                            />
                        </div>
                        <div className="px2 center">
                            <div style={{ color: colors.darkGrey }}>Connect to a ledger hardware wallet</div>
                            <div style={{ paddingTop: 21, paddingBottom: 29 }}>
                                <img src="/images/ledger_icon.png" style={{ width: 80 }} />
                            </div>
                            <div>
                                <RaisedButton
                                    style={{ width: '100%' }}
                                    label="Use Ledger"
                                    onClick={this.props.onToggleLedgerDialog}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }
    private _isBlockchainReady(): boolean {
        return this.props.blockchainIsLoaded && !_.isUndefined(this.props.blockchain);
    }
}
