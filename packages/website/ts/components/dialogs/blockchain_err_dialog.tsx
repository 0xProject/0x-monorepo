import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { BlockchainErrs, Networks } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { constants } from 'ts/utils/constants';

interface BlockchainErrDialogProps {
    blockchain: Blockchain;
    blockchainErr: BlockchainErrs;
    isOpen: boolean;
    userAddress: string;
    toggleDialogFn: (isOpen: boolean) => void;
    networkId: number;
}

export class BlockchainErrDialog extends React.Component<BlockchainErrDialogProps, undefined> {
    public render(): React.ReactNode {
        const dialogActions = [
            <FlatButton
                key="blockchainErrOk"
                label="Ok"
                primary={true}
                onClick={this.props.toggleDialogFn.bind(this.props.toggleDialogFn, false)}
            />,
        ];

        const hasWalletAddress = this.props.userAddress !== '';
        return (
            <Dialog
                title={this._getTitle(hasWalletAddress)}
                titleStyle={{ fontWeight: 100 }}
                actions={dialogActions}
                open={this.props.isOpen}
                contentStyle={{ width: 400 }}
                onRequestClose={this.props.toggleDialogFn.bind(this.props.toggleDialogFn, false)}
                autoScrollBodyContent={true}
            >
                <div className="pt2" style={{ color: colors.grey700 }}>
                    {this._renderExplanation(hasWalletAddress)}
                </div>
            </Dialog>
        );
    }
    private _getTitle(hasWalletAddress: boolean): string {
        if (this.props.blockchainErr === BlockchainErrs.AContractNotDeployedOnNetwork) {
            return '0x smart contracts not found';
        } else if (!hasWalletAddress) {
            return 'Enable wallet communication';
        } else if (this.props.blockchainErr === BlockchainErrs.DisconnectedFromEthereumNode) {
            return 'Disconnected from Ethereum network';
        } else if (this.props.blockchainErr === BlockchainErrs.DefaultTokensNotInTokenRegistry) {
            return 'Default TokenRegistry tokens missing';
        } else {
            return 'Unexpected error';
        }
    }
    private _renderExplanation(hasWalletAddress: boolean): React.ReactNode {
        if (this.props.blockchainErr === BlockchainErrs.AContractNotDeployedOnNetwork) {
            return this._renderContractsNotDeployedExplanation();
        } else if (!hasWalletAddress) {
            return this._renderNoWalletFoundExplanation();
        } else if (this.props.blockchainErr === BlockchainErrs.DisconnectedFromEthereumNode) {
            return this._renderDisconnectedFromNode();
        } else if (this.props.blockchainErr === BlockchainErrs.DefaultTokensNotInTokenRegistry) {
            return this._renderDefaultTokenNotInTokenRegistry();
        } else {
            return this._renderUnexpectedErrorExplanation();
        }
    }
    private _renderDisconnectedFromNode(): React.ReactNode {
        return (
            <div>
                You were disconnected from the backing Ethereum node. If using{' '}
                <a href={constants.URL_METAMASK_CHROME_STORE} target="_blank">
                    Metamask
                </a>{' '}
                or{' '}
                <a href={constants.URL_MIST_DOWNLOAD} target="_blank">
                    Mist
                </a>{' '}
                try refreshing the page. If using a locally hosted Ethereum node, make sure it's still running.
            </div>
        );
    }
    private _renderDefaultTokenNotInTokenRegistry(): React.ReactNode {
        return (
            <div>
                The TokenRegistry deployed on your network does not contain the needed default tokens for 0x Portal to
                operate. Please try one of the supported networks (Mainnet, Kovan, Ropsten, Rinkeby). If on a local
                Testnet, make sure the TokenRegistry contract is deployed and loaded with some default tokens (i.e WETH
                & ZRX).
            </div>
        );
    }
    private _renderUnexpectedErrorExplanation(): React.ReactNode {
        return <div>We encountered an unexpected error. Please try refreshing the page.</div>;
    }
    private _renderNoWalletFoundExplanation(): React.ReactNode {
        return (
            <div>
                <div>
                    We were unable to access an Ethereum wallet you control. In order to interact with the 0x portal
                    dApp, we need a way to interact with one of your Ethereum wallets. There are two easy ways you can
                    enable us to do that:
                </div>
                <h4>1. Metamask chrome extension</h4>
                <div>
                    You can install the{' '}
                    <a href={constants.URL_METAMASK_CHROME_STORE} target="_blank">
                        Metamask
                    </a>{' '}
                    Chrome extension Ethereum wallet. Once installed and set up, refresh this page.
                    <div className="pt1">
                        <span className="bold">Note:</span> If you already have Metamask installed, make sure it is
                        unlocked.
                    </div>
                </div>
                <h4>Parity Signer</h4>
                <div>
                    The{' '}
                    <a href={constants.URL_PARITY_CHROME_STORE} target="_blank">
                        Parity Signer Chrome extension
                    </a>{' '}
                    lets you connect to a locally running Parity node. Make sure you have started your local Parity node
                    with `parity ui` or `parity --chain kovan ui` in order to connect to mainnet or Kovan respectively.
                </div>
                <div className="pt2">
                    <span className="bold">Note:</span> If you have done one of the above steps and are still seeing
                    this message, we might still be unable to retrieve an Ethereum address by calling
                    `web3.eth.accounts`. Make sure you have created at least one Ethereum address.
                </div>
            </div>
        );
    }
    private _renderContractsNotDeployedExplanation(): React.ReactNode {
        return (
            <div>
                <div>
                    The 0x smart contracts are not deployed on the Ethereum network you are currently connected to
                    (network Id: {this.props.networkId}). In order to use the 0x portal dApp, please connect to the{' '}
                    {Networks.Kovan} testnet (network Id: {constants.NETWORK_ID_KOVAN}) or ${constants.MAINNET_NAME}{' '}
                    (network Id: ${constants.NETWORK_ID_MAINNET}).
                </div>
                <h4>Metamask</h4>
                <div>
                    If you are using{' '}
                    <a href={constants.URL_METAMASK_CHROME_STORE} target="_blank">
                        Metamask
                    </a>
                    , you can switch networks in the top left corner of the extension popover.
                </div>
                <h4>Parity Signer</h4>
                <div>
                    If using the{' '}
                    <a href={constants.URL_PARITY_CHROME_STORE} target="_blank">
                        Parity Signer Chrome extension
                    </a>
                    , make sure to start your local Parity node with `parity ui` or `parity --chain Kovan ui` in order
                    to connect to mainnet \ or Kovan respectively.
                </div>
            </div>
        );
    }
}
