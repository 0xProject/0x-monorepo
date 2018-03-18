import { colors } from '@0xproject/react-shared';
import { addressUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import TextField from 'material-ui/TextField';
import * as React from 'react';
import { RequiredLabel } from 'ts/components/ui/required_label';

interface AddressInputProps {
    disabled?: boolean;
    initialAddress: string;
    isRequired?: boolean;
    hintText?: string;
    shouldHideLabel?: boolean;
    label?: string;
    shouldShowIncompleteErrs?: boolean;
    updateAddress: (address?: string) => void;
}

interface AddressInputState {
    address: string;
    errMsg: string;
}

export class AddressInput extends React.Component<AddressInputProps, AddressInputState> {
    constructor(props: AddressInputProps) {
        super(props);
        this.state = {
            address: this.props.initialAddress,
            errMsg: '',
        };
    }
    public componentWillReceiveProps(nextProps: AddressInputProps) {
        if (nextProps.shouldShowIncompleteErrs && this.props.isRequired && this.state.address === '') {
            this.setState({
                errMsg: 'Address is required',
            });
        }
    }
    public render() {
        const label = this.props.isRequired ? <RequiredLabel label={this.props.label} /> : this.props.label;
        const labelDisplay = this.props.shouldHideLabel ? 'hidden' : 'block';
        const hintText = this.props.hintText ? this.props.hintText : '';
        return (
            <div className="overflow-hidden">
                <TextField
                    id={`address-field-${this.props.label}`}
                    disabled={_.isUndefined(this.props.disabled) ? false : this.props.disabled}
                    fullWidth={true}
                    hintText={hintText}
                    floatingLabelFixed={true}
                    floatingLabelStyle={{ color: colors.grey, display: labelDisplay }}
                    floatingLabelText={label}
                    errorText={this.state.errMsg}
                    value={this.state.address}
                    onChange={this._onOrderTakerAddressUpdated.bind(this)}
                />
            </div>
        );
    }
    private _onOrderTakerAddressUpdated(e: any) {
        const address = e.target.value.toLowerCase();
        const isValidAddress = addressUtils.isAddress(address) || address === '';
        const errMsg = isValidAddress ? '' : 'Invalid ethereum address';
        this.setState({
            address,
            errMsg,
        });
        const addressIfValid = isValidAddress ? address : undefined;
        this.props.updateAddress(addressIfValid);
    }
}
