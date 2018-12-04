import { colors } from '@0x/react-shared';
import { addressUtils } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { Input } from 'ts/components/ui/input';
import { Text } from 'ts/components/ui/text';

export interface ConfigGeneratorAddressInputProps {
    value?: string;
    onChange?: (address: string) => void;
}

export interface ConfigGeneratorAddressInputState {
    errMsg: string;
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
        const border = hasError ? '1px solid red' : undefined;
        return (
            <Container height="80px">
                <Input
                    width="100%"
                    fontSize="16px"
                    padding="0.7em 1em"
                    value={this.props.value}
                    onChange={this._handleChange}
                    placeholder="0xe99...aa8da4"
                    border={border}
                />
                <Container marginTop="5px" isHidden={!hasError} height="25px">
                    <Text fontSize="14px" fontColor={colors.grey} fontStyle="italic">
                        {errMsg}
                    </Text>
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
        this.props.onChange(address);
    };
}
