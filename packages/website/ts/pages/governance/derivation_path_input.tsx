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
import { Button } from 'ts/components/button';
import { Input, InputWidth } from 'ts/components/modals/input';

import { ChangeEvent } from 'react';

interface InputProps {
    path: string;
    onChangePath?: (selectedPath: string) => void;
}

interface RowProps {
    color: string;
    width: number;
}

export class DerivationPathInput extends React.Component<InputProps> {
    public pathRef: React.RefObject<HTMLInputElement> = React.createRef();
    constructor(props: InputProps) {
        super(props);
    }
    public render(): React.ReactNode {
        const { path } = this.props;
        return (
            <Wrapper>
                <Input name="derivationPath" label="Derivation Path" type="text" defaultValue={path} ref={this.pathRef} />
                <ButtonUpdate onClick={this._updatePath.bind(this)}>Update</ButtonUpdate>
            </Wrapper>
        );
    }
    private _updatePath(): void {
        if (this.props.onChangePath) {
            this.props.onChangePath(this.pathRef.current.value);
        }
    }
}
const Wrapper = styled.div<{ marginBottom?: string }>`
    display: flex;
`;

const Table = styled.table`
    border-collapse: collapse;
    width: 100%;
`;

const ButtonUpdate = styled(Button).attrs({
    isTransparent: true,
    type: 'button',
})`
margin-left: 30px;
`;
