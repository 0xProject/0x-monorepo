import { colors, constants as sharedConstants } from '@0x/react-shared';
import { BigNumber, logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table';
import TextField from 'material-ui/TextField';
import * as React from 'react';
import ReactTooltip = require('react-tooltip');
import { Blockchain } from 'ts/blockchain';
import { NetworkDropDown } from 'ts/components/dropdowns/network_drop_down';
import { LifeCycleRaisedButton } from 'ts/components/ui/lifecycle_raised_button';
import { Dispatcher } from 'ts/redux/dispatcher';
import { ProviderType } from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

const VALID_ETHEREUM_DERIVATION_PATH_PREFIX = `44'/60'`;

enum LedgerSteps {
    CONNECT,
    SELECT_ADDRESS,
}

interface LedgerConfigDialogProps {
    isOpen: boolean;
    toggleDialogFn: (isOpen: boolean) => void;
    dispatcher: Dispatcher;
    blockchain: Blockchain;
    networkId?: number;
    providerType: ProviderType;
}

interface LedgerConfigDialogState {
    connectionErrMsg: string;
    stepIndex: LedgerSteps;
    userAddresses: string[];
    addressBalances: BigNumber[];
    derivationPath: string;
    derivationErrMsg: string;
    preferredNetworkId: number;
}

export class LedgerConfigDialog extends React.Component<LedgerConfigDialogProps, LedgerConfigDialogState> {
    public static defaultProps = {
        networkId: 1,
    };
    constructor(props: LedgerConfigDialogProps) {
        super(props);
        const derivationPathIfExists = props.blockchain.getLedgerDerivationPathIfExists();
        this.state = {
            connectionErrMsg: '',
            stepIndex: LedgerSteps.CONNECT,
            userAddresses: [],
            addressBalances: [],
            derivationPath: _.isUndefined(derivationPathIfExists)
                ? configs.DEFAULT_DERIVATION_PATH
                : derivationPathIfExists,
            derivationErrMsg: '',
            preferredNetworkId: props.networkId,
        };
    }
    public render(): React.ReactNode {
        const dialogActions = [
            <FlatButton key="ledgerConnectCancel" label="Cancel" onClick={this._onClose.bind(this)} />,
        ];
        const dialogTitle =
            this.state.stepIndex === LedgerSteps.CONNECT ? 'Connect to your Ledger' : 'Select desired address';
        return (
            <Dialog
                title={dialogTitle}
                titleStyle={{ fontWeight: 100 }}
                actions={dialogActions}
                open={this.props.isOpen}
                onRequestClose={this._onClose.bind(this)}
                autoScrollBodyContent={true}
                bodyStyle={{ paddingBottom: 0 }}
            >
                <div style={{ color: colors.grey700, paddingTop: 1 }}>
                    {this.state.stepIndex === LedgerSteps.CONNECT && this._renderConnectStep()}
                    {this.state.stepIndex === LedgerSteps.SELECT_ADDRESS && this._renderSelectAddressStep()}
                </div>
            </Dialog>
        );
    }
    private _renderConnectStep(): React.ReactNode {
        const networkIds = _.values(sharedConstants.NETWORK_ID_BY_NAME);
        return (
            <div>
                <div className="h4 pt3">Follow these instructions before proceeding:</div>
                <ol className="mb0">
                    <li className="pb1">Connect your Ledger Nano S & Open the Ethereum application</li>
                    <li className="pb1">Verify that "Browser Support" AND "Contract Data" are enabled in Settings</li>
                    <li className="pb1">
                        If no Browser Support is found in settings, verify that you have{' '}
                        <a href="https://www.ledgerwallet.com/apps/manager" target="_blank">
                            Firmware >1.2
                        </a>
                    </li>
                    <li>Choose your desired network:</li>
                </ol>
                <div className="pb2">
                    <NetworkDropDown
                        updateSelectedNetwork={this._onSelectedNetworkUpdated.bind(this)}
                        selectedNetworkId={this.state.preferredNetworkId}
                        avialableNetworkIds={networkIds}
                    />
                </div>
                <div className="center pb3">
                    <LifeCycleRaisedButton
                        isPrimary={true}
                        labelReady="Connect to Ledger"
                        labelLoading="Connecting..."
                        labelComplete="Connected!"
                        onClickAsyncFn={this._onConnectLedgerClickAsync.bind(this, true)}
                    />
                    {!_.isEmpty(this.state.connectionErrMsg) && (
                        <div className="pt2 left-align" style={{ color: colors.red200 }}>
                            {this.state.connectionErrMsg}
                        </div>
                    )}
                </div>
            </div>
        );
    }
    private _renderSelectAddressStep(): React.ReactNode {
        return (
            <div>
                <div>
                    <Table bodyStyle={{ height: 300 }} onRowSelection={this._onAddressSelected.bind(this)}>
                        <TableHeader displaySelectAll={false}>
                            <TableRow>
                                <TableHeaderColumn colSpan={2}>Address</TableHeaderColumn>
                                <TableHeaderColumn>Balance</TableHeaderColumn>
                            </TableRow>
                        </TableHeader>
                        <TableBody>{this._renderAddressTableRows()}</TableBody>
                    </Table>
                </div>
                <div className="flex pt2" style={{ height: 100 }}>
                    <div className="overflow-hidden" style={{ width: 180 }}>
                        <TextField
                            floatingLabelFixed={true}
                            floatingLabelStyle={{ color: colors.grey }}
                            floatingLabelText="Update path derivation (advanced)"
                            value={this.state.derivationPath}
                            errorText={this.state.derivationErrMsg}
                            onChange={this._onDerivationPathChanged.bind(this)}
                        />
                    </div>
                    <div className="pl2" style={{ paddingTop: 28 }}>
                        <LifeCycleRaisedButton
                            labelReady="Update"
                            labelLoading="Updating..."
                            labelComplete="Updated!"
                            onClickAsyncFn={this._onFetchAddressesForDerivationPathAsync.bind(this)}
                        />
                    </div>
                </div>
            </div>
        );
    }
    private _renderAddressTableRows(): React.ReactNode {
        const rows = _.map(this.state.userAddresses, (userAddress: string, i: number) => {
            const balanceInWei = this.state.addressBalances[i];
            const addressTooltipId = `address-${userAddress}`;
            const balanceTooltipId = `balance-${userAddress}`;
            const networkName = sharedConstants.NETWORK_NAME_BY_ID[this.props.networkId];
            // We specifically prefix kovan ETH.
            // TODO: We should probably add prefixes for all networks
            const isKovanNetwork = networkName === 'Kovan';
            const balanceInEth = Web3Wrapper.toUnitAmount(balanceInWei, constants.DECIMAL_PLACES_ETH);
            const balanceString = `${balanceInEth.toString()} ${isKovanNetwork ? 'Kovan ' : ''}ETH`;
            return (
                <TableRow key={userAddress} style={{ height: 40 }}>
                    <TableRowColumn colSpan={2}>
                        <div data-tip={true} data-for={addressTooltipId}>
                            {userAddress}
                        </div>
                        <ReactTooltip id={addressTooltipId}>{userAddress}</ReactTooltip>
                    </TableRowColumn>
                    <TableRowColumn>
                        <div data-tip={true} data-for={balanceTooltipId}>
                            {balanceString}
                        </div>
                        <ReactTooltip id={balanceTooltipId}>{balanceString}</ReactTooltip>
                    </TableRowColumn>
                </TableRow>
            );
        });
        return rows;
    }
    private _onClose(): void {
        this.setState({
            connectionErrMsg: '',
            stepIndex: LedgerSteps.CONNECT,
        });
        const isOpen = false;
        this.props.toggleDialogFn(isOpen);
    }
    private _onAddressSelected(selectedRowIndexes: number[]): void {
        const selectedRowIndex = selectedRowIndexes[0];
        const selectedAddress = this.state.userAddresses[selectedRowIndex];
        const selectAddressBalance = this.state.addressBalances[selectedRowIndex];
        this.props.dispatcher.updateUserAddress(selectedAddress);
        this.props.blockchain.updateWeb3WrapperPrevUserAddress(selectedAddress);
        // tslint:disable-next-line:no-floating-promises
        this.props.blockchain.fetchTokenInformationAsync();
        this.props.dispatcher.updateUserWeiBalance(selectAddressBalance);
        this.setState({
            stepIndex: LedgerSteps.CONNECT,
        });
        const isOpen = false;
        this.props.toggleDialogFn(isOpen);
    }
    private async _onFetchAddressesForDerivationPathAsync(): Promise<boolean> {
        const currentlySetPath = this.props.blockchain.getLedgerDerivationPathIfExists();
        let didSucceed;
        if (currentlySetPath === this.state.derivationPath) {
            didSucceed = true;
            return didSucceed;
        }
        this.props.blockchain.updateLedgerDerivationPathIfExists(this.state.derivationPath);
        didSucceed = await this._fetchAddressesAndBalancesAsync();
        if (!didSucceed) {
            this.setState({
                derivationErrMsg: 'Failed to connect to Ledger.',
            });
        }
        return didSucceed;
    }
    private async _fetchAddressesAndBalancesAsync(): Promise<boolean> {
        let userAddresses: string[];
        const addressBalances: BigNumber[] = [];
        try {
            userAddresses = await this._getUserAddressesAsync();
            for (const address of userAddresses) {
                const balanceInWei = await this.props.blockchain.getBalanceInWeiAsync(address);
                addressBalances.push(balanceInWei);
            }
        } catch (err) {
            logUtils.log(`Ledger error: ${JSON.stringify(err)}`);
            this.setState({
                connectionErrMsg: 'Failed to connect. Follow the instructions and try again.',
            });
            return false;
        }
        this.setState({
            userAddresses,
            addressBalances,
        });
        return true;
    }
    private _onDerivationPathChanged(_event: any, derivationPath: string): void {
        let derivationErrMsg = '';
        if (!_.startsWith(derivationPath, VALID_ETHEREUM_DERIVATION_PATH_PREFIX)) {
            derivationErrMsg = 'Must be valid Ethereum path.';
        }

        this.setState({
            derivationPath,
            derivationErrMsg,
        });
    }
    private async _onConnectLedgerClickAsync(): Promise<boolean> {
        const isU2FSupported = await utils.isU2FSupportedAsync();
        if (!isU2FSupported) {
            logUtils.log(`U2F not supported in this browser`);
            this.setState({
                connectionErrMsg: 'U2F not supported by this browser. Try using Chrome.',
            });
            return false;
        }

        if (
            this.props.providerType !== ProviderType.Ledger ||
            (this.props.providerType === ProviderType.Ledger && this.props.networkId !== this.state.preferredNetworkId)
        ) {
            await this.props.blockchain.updateProviderToLedgerAsync(this.state.preferredNetworkId);
        }

        const didSucceed = await this._fetchAddressesAndBalancesAsync();
        if (didSucceed) {
            this.setState({
                stepIndex: LedgerSteps.SELECT_ADDRESS,
                connectionErrMsg: '',
            });
        }
        return didSucceed;
    }
    private async _getUserAddressesAsync(): Promise<string[]> {
        let userAddresses: string[];
        userAddresses = await this.props.blockchain.getUserAccountsAsync();

        if (_.isEmpty(userAddresses)) {
            throw new Error('No addresses retrieved.');
        }
        return userAddresses;
    }
    private _onSelectedNetworkUpdated(_event: any, _index: number, networkId: number): void {
        this.setState({
            preferredNetworkId: networkId,
        });
    }
}
