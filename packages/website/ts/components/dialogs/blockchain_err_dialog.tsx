import * as _ from 'lodash';
import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import {colors} from 'material-ui/styles';
import {constants} from 'ts/utils/constants';
import {configs} from 'ts/utils/configs';
import {Blockchain} from 'ts/blockchain';
import {BlockchainErrs} from 'ts/types';

interface BlockchainErrDialogProps {
    blockchain: Blockchain;
    blockchainErr: BlockchainErrs;
    isOpen: boolean;
    userAddress: string;
    toggleDialogFn: (isOpen: boolean) => void;
    networkId: number;
}

export class BlockchainErrDialog extends React.Component<BlockchainErrDialogProps, undefined> {
    public render() {
        const dialogActions = [
            <FlatButton
                label="Ok"
                primary={true}
                onTouchTap={this.props.toggleDialogFn.bind(this.props.toggleDialogFn, false)}
            />,
        ];

        const hasWalletAddress = this.props.userAddress !== '';
        return (
            <Dialog
                title={this.getTitle(hasWalletAddress)}
                titleStyle={{fontWeight: 100}}
                actions={dialogActions}
                open={this.props.isOpen}
                contentStyle={{width: 400}}
                onRequestClose={this.props.toggleDialogFn.bind(this.props.toggleDialogFn, false)}
                autoScrollBodyContent={true}
            >
                <div className="pt2" style={{color: colors.grey700}}>
                    {this.renderExplanation(hasWalletAddress)}
                </div>
            </Dialog>
        );
    }
    private getTitle(hasWalletAddress: boolean) {
        if (this.props.blockchainErr === BlockchainErrs.A_CONTRACT_NOT_DEPLOYED_ON_NETWORK) {
            return '0x smart contracts not found';
        } else if (!hasWalletAddress) {
            return 'Enable wallet communication';
        } else if (this.props.blockchainErr === BlockchainErrs.DISCONNECTED_FROM_ETHEREUM_NODE) {
            return 'Disconnected from Ethereum network';
        } else {
            return 'Unexpected error';
        }
    }
    private renderExplanation(hasWalletAddress: boolean) {
        if (this.props.blockchainErr === BlockchainErrs.A_CONTRACT_NOT_DEPLOYED_ON_NETWORK) {
            return this.renderContractsNotDeployedExplanation();
        } else if (!hasWalletAddress) {
            return this.renderNoWalletFoundExplanation();
        } else if (this.props.blockchainErr === BlockchainErrs.DISCONNECTED_FROM_ETHEREUM_NODE) {
            return this.renderDisconnectedFromNode();
        } else {
            return this.renderUnexpectedErrorExplanation();
        }
    }
    private renderDisconnectedFromNode() {
        return (
            <div>
                You were disconnected from the backing Ethereum node.
                {' '}If using <a href={constants.METAMASK_CHROME_STORE_URL} target="_blank">
                    Metamask
                </a> or <a href={constants.MIST_DOWNLOAD_URL} target="_blank">Mist</a> try refreshing
                {' '}the page. If using a locally hosted Ethereum node, make sure it's still running.
            </div>
        );
    }
    private renderUnexpectedErrorExplanation() {
        return (
            <div>
                We encountered an unexpected error. Please try refreshing the page.
            </div>
        );
    }
    private renderNoWalletFoundExplanation() {
        return (
            <div>
                <div>
                    We were unable to access an Ethereum wallet you control. In order to interact
                    {' '}with the 0x portal dApp,
                    we need a way to interact with one of your Ethereum wallets.
                    {' '}There are two easy ways you can enable us to do that:
                </div>
                <h4>1. Metamask chrome extension</h4>
                <div>
                    You can install the{' '}
                    <a href={constants.METAMASK_CHROME_STORE_URL} target="_blank">
                        Metamask
                    </a> Chrome extension Ethereum wallet. Once installed and set up, refresh this page.
                    <div className="pt1">
                        <span className="bold">Note:</span>
                        {' '}If you already have Metamask installed, make sure it is unlocked.
                    </div>
                </div>
                <h4>Parity Signer</h4>
                <div>
                    The <a href={constants.PARITY_CHROME_STORE_URL} target="_blank">Parity Signer
                    Chrome extension</a>{' '}lets you connect to a locally running Parity node.
                    Make sure you have started your local Parity node with{' '}
                    {configs.isMainnetEnabled && '`parity ui` or'} `parity --chain kovan ui`{' '}
                    in order to connect to {configs.isMainnetEnabled ? 'mainnet or Kovan respectively.' : 'Kovan.'}
                </div>
                <div className="pt2">
                    <span className="bold">Note:</span>
                    {' '}If you have done one of the above steps and are still seeing this message,
                    {' '}we might still be unable to retrieve an Ethereum address by calling `web3.eth.accounts`.
                    {' '}Make sure you have created at least one Ethereum address.
                </div>
            </div>
        );
    }
    private renderContractsNotDeployedExplanation() {
        return (
            <div>
                <div>
                    The 0x smart contracts are not deployed on the Ethereum network you are
                    {' '}currently connected to (network Id: {this.props.networkId}).
                    {' '}In order to use the 0x portal dApp,
                    {' '}please connect to the
                    {' '}{constants.TESTNET_NAME} testnet (network Id: {constants.TESTNET_NETWORK_ID})
                    {configs.isMainnetEnabled ?
                        ` or ${constants.MAINNET_NAME} (network Id: ${constants.MAINNET_NETWORK_ID}).` :
                        `.`
                    }
                </div>
                <h4>Metamask</h4>
                <div>
                    If you are using{' '}
                    <a href={constants.METAMASK_CHROME_STORE_URL} target="_blank">
                        Metamask
                    </a>, you can switch networks in the top left corner of the extension popover.
                </div>
                <h4>Parity Signer</h4>
                <div>
                    If using the <a href={constants.PARITY_CHROME_STORE_URL} target="_blank">Parity Signer
                    Chrome extension</a>, make sure to start your local Parity node with{' '}
                    {configs.isMainnetEnabled ?
                        '`parity ui` or `parity --chain Kovan ui` in order to connect to mainnet \
                         or Kovan respectively.' :
                         '`parity --chain kovan ui` in order to connect to Kovan.'
                    }
                </div>
            </div>
        );
    }
}
