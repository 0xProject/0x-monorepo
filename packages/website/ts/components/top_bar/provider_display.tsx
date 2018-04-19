import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { ProviderPicker } from 'ts/components/top_bar/provider_picker';
import { DropDown } from 'ts/components/ui/drop_down';
import { Identicon } from 'ts/components/ui/identicon';
import { Dispatcher } from 'ts/redux/dispatcher';
import { ProviderType } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

const IDENTICON_DIAMETER = 32;

interface ProviderDisplayProps {
    dispatcher: Dispatcher;
    userAddress: string;
    networkId: number;
    injectedProviderName: string;
    providerType: ProviderType;
    onToggleLedgerDialog: () => void;
    blockchain: Blockchain;
}

interface ProviderDisplayState {}

export class ProviderDisplay extends React.Component<ProviderDisplayProps, ProviderDisplayState> {
    public render() {
        const isAddressAvailable = !_.isEmpty(this.props.userAddress);
        const isExternallyInjectedProvider =
            this.props.providerType === ProviderType.Injected && this.props.injectedProviderName !== '0x Public';
        const displayAddress = isAddressAvailable
            ? utils.getAddressBeginAndEnd(this.props.userAddress)
            : isExternallyInjectedProvider
                ? 'Account locked'
                : '0x0000...0000';
        // If the "injected" provider is our fallback public node, then we want to
        // show the "connect a wallet" message instead of the providerName
        const injectedProviderName = isExternallyInjectedProvider
            ? this.props.injectedProviderName
            : 'Connect a wallet';
        const providerTitle =
            this.props.providerType === ProviderType.Injected ? injectedProviderName : 'Ledger Nano S';
        const hoverActiveNode = (
            <div className="flex right lg-pr0 md-pr2 sm-pr2" style={{ paddingTop: 16 }}>
                <div>
                    <Identicon address={this.props.userAddress} diameter={IDENTICON_DIAMETER} />
                </div>
                <div style={{ marginLeft: 12, paddingTop: 1 }}>
                    <div style={{ fontSize: 12, color: colors.amber800 }}>{providerTitle}</div>
                    <div style={{ fontSize: 14 }}>{displayAddress}</div>
                </div>
                <div
                    style={{ borderLeft: `1px solid ${colors.grey300}`, marginLeft: 17, paddingTop: 1 }}
                    className="px2"
                >
                    <i style={{ fontSize: 30, color: colors.grey300 }} className="zmdi zmdi zmdi-chevron-down" />
                </div>
            </div>
        );
        const hasInjectedProvider =
            this.props.injectedProviderName !== '0x Public' && this.props.providerType === ProviderType.Injected;
        const hasLedgerProvider = this.props.providerType === ProviderType.Ledger;
        const horizontalPosition = hasInjectedProvider || hasLedgerProvider ? 'left' : 'middle';
        return (
            <div style={{ width: 'fit-content', height: 48, float: 'right' }}>
                <DropDown
                    hoverActiveNode={hoverActiveNode}
                    popoverContent={this.renderPopoverContent(hasInjectedProvider, hasLedgerProvider)}
                    anchorOrigin={{ horizontal: horizontalPosition, vertical: 'bottom' }}
                    targetOrigin={{ horizontal: horizontalPosition, vertical: 'top' }}
                    zDepth={1}
                />
            </div>
        );
    }
    public renderPopoverContent(hasInjectedProvider: boolean, hasLedgerProvider: boolean) {
        if (hasInjectedProvider || hasLedgerProvider) {
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
}
