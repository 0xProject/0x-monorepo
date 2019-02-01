import { BigNumber, logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { EthWethConversionDialog } from 'ts/components/dialogs/eth_weth_conversion_dialog';
import { Dispatcher } from 'ts/redux/dispatcher';
import { BlockchainCallErrs, Side, Token } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { errorReporter } from 'ts/utils/error_reporter';
import { utils } from 'ts/utils/utils';

interface EthWethConversionButtonProps {
    userAddress: string;
    networkId: number;
    direction: Side;
    ethToken: Token;
    dispatcher: Dispatcher;
    blockchain: Blockchain;
    userEtherBalanceInWei: BigNumber;
    isOutdatedWrappedEther: boolean;
    onConversionSuccessful?: () => void;
    isDisabled?: boolean;
    lastForceTokenStateRefetch: number;
    refetchEthTokenStateAsync: () => Promise<void>;
}

interface EthWethConversionButtonState {
    isEthConversionDialogVisible: boolean;
    isEthConversionHappening: boolean;
}

export class EthWethConversionButton extends React.Component<
    EthWethConversionButtonProps,
    EthWethConversionButtonState
> {
    public static defaultProps: Partial<EthWethConversionButtonProps> = {
        isDisabled: false,
        onConversionSuccessful: _.noop.bind(_),
    };
    public constructor(props: EthWethConversionButtonProps) {
        super(props);
        this.state = {
            isEthConversionDialogVisible: false,
            isEthConversionHappening: false,
        };
    }
    public render(): React.ReactNode {
        const labelStyle = this.state.isEthConversionHappening ? { fontSize: 10 } : {};
        let callToActionLabel;
        let inProgressLabel;
        if (this.props.direction === Side.Deposit) {
            callToActionLabel = 'Wrap';
            inProgressLabel = 'Wrapping...';
        } else {
            callToActionLabel = 'Unwrap';
            inProgressLabel = 'Unwrapping...';
        }
        return (
            <div>
                <RaisedButton
                    style={{ width: '100%' }}
                    labelStyle={labelStyle}
                    disabled={this.props.isDisabled || this.state.isEthConversionHappening}
                    label={this.state.isEthConversionHappening ? inProgressLabel : callToActionLabel}
                    onClick={this._toggleConversionDialog.bind(this)}
                />
                <EthWethConversionDialog
                    blockchain={this.props.blockchain}
                    userAddress={this.props.userAddress}
                    networkId={this.props.networkId}
                    direction={this.props.direction}
                    isOpen={this.state.isEthConversionDialogVisible}
                    onComplete={this._onConversionAmountSelectedAsync.bind(this)}
                    onCancelled={this._toggleConversionDialog.bind(this)}
                    etherBalanceInWei={this.props.userEtherBalanceInWei}
                    token={this.props.ethToken}
                    lastForceTokenStateRefetch={this.props.lastForceTokenStateRefetch}
                />
            </div>
        );
    }
    private _toggleConversionDialog(): void {
        this.setState({
            isEthConversionDialogVisible: !this.state.isEthConversionDialogVisible,
        });
    }
    private async _onConversionAmountSelectedAsync(direction: Side, value: BigNumber): Promise<void> {
        this.setState({
            isEthConversionHappening: true,
        });
        this._toggleConversionDialog();
        const token = this.props.ethToken;
        try {
            if (direction === Side.Deposit) {
                await this.props.blockchain.convertEthToWrappedEthTokensAsync(token.address, value);
                const ethAmount = Web3Wrapper.toUnitAmount(value, constants.DECIMAL_PLACES_ETH);
                this.props.dispatcher.showFlashMessage(`Successfully wrapped ${ethAmount.toString()} ETH to WETH`);
            } else {
                await this.props.blockchain.convertWrappedEthTokensToEthAsync(token.address, value);
                const tokenAmount = Web3Wrapper.toUnitAmount(value, token.decimals);
                this.props.dispatcher.showFlashMessage(`Successfully unwrapped ${tokenAmount.toString()} WETH to ETH`);
            }
            if (!this.props.isOutdatedWrappedEther) {
                await this.props.refetchEthTokenStateAsync();
            }
            this.props.onConversionSuccessful();
        } catch (err) {
            const errMsg = `${err}`;
            if (_.includes(errMsg, BlockchainCallErrs.UserHasNoAssociatedAddresses)) {
                this.props.dispatcher.updateShouldBlockchainErrDialogBeOpen(true);
            } else if (!utils.didUserDenyWeb3Request(errMsg)) {
                logUtils.log(`Unexpected error encountered: ${err}`);
                logUtils.log(err.stack);
                const errorMsg =
                    direction === Side.Deposit
                        ? 'Failed to wrap your ETH. Please try again.'
                        : 'Failed to unwrap your WETH. Please try again.';
                this.props.dispatcher.showFlashMessage(errorMsg);
                errorReporter.report(err);
            }
        }
        this.setState({
            isEthConversionHappening: false,
        });
    }
}
