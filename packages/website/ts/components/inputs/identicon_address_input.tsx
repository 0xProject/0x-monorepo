import * as React from 'react';
import { AddressInput } from 'ts/components/inputs/address_input';
import { Identicon } from 'ts/components/ui/identicon';
import { InputLabel } from 'ts/components/ui/input_label';
import { RequiredLabel } from 'ts/components/ui/required_label';

interface IdenticonAddressInputProps {
    initialAddress: string;
    isRequired?: boolean;
    label: string;
    updateOrderAddress: (address?: string) => void;
}

interface IdenticonAddressInputState {
    address: string;
}

export class IdenticonAddressInput extends React.Component<IdenticonAddressInputProps, IdenticonAddressInputState> {
    constructor(props: IdenticonAddressInputProps) {
        super(props);
        this.state = {
            address: props.initialAddress,
        };
    }
    public render(): React.ReactNode {
        const label = this.props.isRequired ? <RequiredLabel label={this.props.label} /> : this.props.label;
        return (
            <div className="relative" style={{ width: '100%' }}>
                <InputLabel text={label} />
                <div className="flex">
                    <div className="col col-1 pb1 pr1" style={{ paddingTop: 13 }}>
                        <Identicon address={this.state.address} diameter={26} />
                    </div>
                    <div className="col col-11 pb1 pl1" style={{ height: 65 }}>
                        <AddressInput
                            hintText="e.g 0x75bE4F78AA3699B3A348c84bDB2a96c3Db..."
                            shouldHideLabel={true}
                            initialAddress={this.props.initialAddress}
                            updateAddress={this._updateAddress.bind(this)}
                        />
                    </div>
                </div>
            </div>
        );
    }
    private _updateAddress(address?: string): void {
        this.setState({
            address,
        });
        this.props.updateOrderAddress(address);
    }
}
