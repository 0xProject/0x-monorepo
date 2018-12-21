import { addressUtils } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Container } from 'ts/components/ui/container';

import { Paragraph } from 'ts/components/text';

export interface ConfigGeneratorAddressInputProps {
    value?: string;
    onChange?: (address: string, isValid: boolean) => void;
}

export interface ConfigGeneratorAddressInputState {
    errMsg: string;
}

export interface InputProps {
    className?: string;
    value?: string;
    width?: string;
    fontSize?: string;
    fontColor?: string;
    padding?: string;
    placeholderColor?: string;
    placeholder?: string;
    backgroundColor?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export class ConfigGeneratorAddressInput extends React.Component<
    ConfigGeneratorAddressInputProps,
    ConfigGeneratorAddressInputState
> {
    public state = {
        errMsg: '',
    };
    public render(): React.ReactNode {
        const { errMsg } = this.state;
        const hasError = !_.isEmpty(errMsg);
        return (
            <Container height="80px">
                <Input value={this.props.value} onChange={this._handleChange} placeholder="0xe99...aa8da4" />
                <Container marginTop="5px" isHidden={!hasError} height="25px">
                    <Paragraph size="small" isNoMargin={true}>
                        {errMsg}
                    </Paragraph>
                </Container>
            </Container>
        );
    }

    private readonly _handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const address = event.target.value;
        const isValidAddress = addressUtils.isAddress(address.toLowerCase()) || address === '';
        const errMsg = isValidAddress ? '' : 'Please enter a valid Ethereum address';
        this.setState({
            errMsg,
        });
        this.props.onChange(address, isValidAddress);
    };
}

const PlainInput: React.StatelessComponent<InputProps> = ({ value, className, placeholder, onChange }) => (
    <input className={className} value={value} onChange={onChange} placeholder={placeholder} />
);

export const Input = styled(PlainInput)`
    background-color: ${colors.white};
    color: ${colors.textDarkSecondary};
    font-size: 1rem;
    width: 100%;
    padding: 16px 20px 18px;
    border-radius: 4px;
    border: 1px solid transparent;
    outline: none;
    &::placeholder {
        color: #333333;
        opacity: 0.5;
    }
`;
