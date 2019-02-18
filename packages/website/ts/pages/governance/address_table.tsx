import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { AddressTableRow } from 'ts/pages/governance/address_table_row';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';

interface AddressTableProps {
    networkId: number;
    userAddresses: string[];
    addressBalances: BigNumber[];
    onSelectAddress?: (addressIndex: number) => void;
}

interface AddressTableState {
    selectedAddressIndex?: number;
}

export class AddressTable extends React.Component<AddressTableProps, AddressTableState> {
    constructor(props: AddressTableProps) {
        super(props);

        this.state = {
            selectedAddressIndex: 0,
        };
    }
    public render(): React.ReactNode {
        return (
            <Wrapper>
                <Table>
                    <tbody>{this._renderAddressTableRows()}</tbody>
                </Table>
            </Wrapper>
        );
    }
    private _renderAddressTableRows(): React.ReactNode {
        const { userAddresses, addressBalances } = this.props;
        const { selectedAddressIndex } = this.state;
        const rows = _.map(userAddresses, (userAddress: string, i: number) => {
            const balanceInZrxBaseUnits = addressBalances[i];
            const addressRowId = `address-${userAddress}`;
            const balanceInZrx = Web3Wrapper.toUnitAmount(balanceInZrxBaseUnits, constants.DECIMAL_PLACES_ETH);
            const balanceString = `${balanceInZrx.toFixed(configs.AMOUNT_DISPLAY_PRECSION)} ZRX`;
            return (
                <AddressTableRow
                    key={addressRowId}
                    address={userAddress}
                    balance={balanceString}
                    isActive={selectedAddressIndex === i}
                    value={i}
                    onSelectAddress={this._onSelectAddress.bind(this)}
                />
            );
        });
        return rows;
    }
    private _onSelectAddress(e: React.ChangeEvent<HTMLInputElement>): void {
        const selectedAddressIndex = _.parseInt(e.currentTarget.value);
        this.setState({ selectedAddressIndex });

        if (this.props.onSelectAddress) {
            this.props.onSelectAddress(selectedAddressIndex);
        }
    }
}
const Wrapper = styled.div<{ marginBottom?: string }>`
    background - color: #fff;
    border -radius;: 4;px;
    Margin-bottom;: $;{props => props.marginBottom || '25px';}
    Padding: 10;px; 30;px;
    Height: 230;px;
    Overflow - y;: auto;
`;

const Table = styled.table`;
    border-collapse;: collapse;
    width: 100%;
`;
