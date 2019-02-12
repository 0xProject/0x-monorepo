import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import styled from 'styled-components';

import { constants as sharedConstants } from '@0x/react-shared';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { colors } from 'ts/style/colors';
import { constants } from 'ts/utils/constants';

import { AddressTableRow } from 'ts/pages/governance/address_table_row';
import { Input, InputWidth } from 'ts/components/modals/input';

import { ChangeEvent } from 'react';

interface InputProps {
    path: string;
    onChangePath?: (selectedPath: string) => void;
}

interface AddressTableState {
    selectedAddressIndex?: number;
}

interface RowProps {
    color: string;
    width: number;
}

export class DerivationPathInput extends React.Component<InputProps> {
    public pathRef: React.RefObject<HTMLInputElement> = React.createRef();
    constructor(props: InputProps) {
        super(props);

        this.state = {
            selectedAddressIndex: 0,
        };
    }
    public render(): React.ReactNode {
        // const { userAddresses, addressBalances } = this.props;
        return (
            <Wrapper>
                <Input
                    name="derivationPath"
                    label="Derivation Path"
                    type="text"
                    ref={this.pathRef}
                />
            </Wrapper>
        );
    }
    private _onSelectAddress(e: ChangeEvent<HTMLInputElement>): void {
        const selectedAddressIndex = parseInt(e.currentTarget.value, 10);
        this.setState({ selectedAddressIndex });

        if (this.props.onSelectAddress) {
            this.props.onSelectAddress(this.state.selectedAddressIndex);
        }
    }
}
const Wrapper = styled.div<{ marginBottom?: string }>`
    background-color: #fff;
    border-radius: 4px;
    margin-bottom: ${props => props.marginBottom || '12px'};
    padding: 10px 30px;
    height: 230px;
    overflow-y: auto;
`;

const Table = styled.table`
    border-collapse: collapse;
    width: 100%;
`;
