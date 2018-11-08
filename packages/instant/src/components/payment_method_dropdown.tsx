import { BigNumber } from '@0x/utils';
import * as React from 'react';

import { format } from '../util/format';

import { Dropdown, DropdownItemConfig } from './ui/dropdown';

export interface PaymentMethodDropdownProps {
    selectedEthAddress: string;
    addressEthBaseAmount: BigNumber;
}

export class PaymentMethodDropdown extends React.Component<PaymentMethodDropdownProps> {
    public static defaultProps = {
        selectedEthAddress: '0xa1b2c3d4e5f6g7h8j9k10',
        addressEthBaseAmount: new BigNumber(10500000000000000000),
    };
    public render(): React.ReactNode {
        const { selectedEthAddress, addressEthBaseAmount } = this.props;
        const value = format.ethAddress(selectedEthAddress);
        const label = format.ethBaseAmount(addressEthBaseAmount) as string;
        return <Dropdown value={value} label={label} items={this._getDropdownItemConfigs()} />;
    }
    private readonly _getDropdownItemConfigs = (): DropdownItemConfig[] => {
        const viewOnEtherscan = {
            text: 'View on Etherscan',
        };
        const copyAddressToClipboard = {
            text: 'Copy address to clipboard',
        };
        return [viewOnEtherscan, copyAddressToClipboard];
    };
}
