import { BigNumber } from '@0x/utils';
import copy from 'copy-to-clipboard';
import * as React from 'react';

import { Network } from '../types';
import { etherscanUtil } from '../util/etherscan';
import { format } from '../util/format';

import { Dropdown, DropdownItemConfig } from './ui/dropdown';

export interface PaymentMethodDropdownProps {
    accountAddress: string;
    accountEthBalanceInWei?: BigNumber;
    network: Network;
}

export class PaymentMethodDropdown extends React.Component<PaymentMethodDropdownProps> {
    public render(): React.ReactNode {
        const { accountAddress, accountEthBalanceInWei } = this.props;
        const value = format.ethAddress(accountAddress);
        const label = format.ethBaseAmount(accountEthBalanceInWei, 4, '') as string;
        return <Dropdown value={value} label={label} items={this._getDropdownItemConfigs()} />;
    }
    private readonly _getDropdownItemConfigs = (): DropdownItemConfig[] => {
        const viewOnEtherscan = {
            text: 'View on Etherscan',
            onClick: this._handleEtherscanClick,
        };
        const copyAddressToClipboard = {
            text: 'Copy address to clipboard',
            onClick: this._handleCopyToClipboardClick,
        };
        return [viewOnEtherscan, copyAddressToClipboard];
    };
    private readonly _handleEtherscanClick = (): void => {
        const { accountAddress, network } = this.props;
        const etherscanUrl = etherscanUtil.getEtherScanEthAddressIfExists(accountAddress, network);
        window.open(etherscanUrl, '_blank');
    };
    private readonly _handleCopyToClipboardClick = (): void => {
        const { accountAddress } = this.props;
        copy(accountAddress);
    };
}
