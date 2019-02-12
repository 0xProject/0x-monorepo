import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { ChangeEvent } from 'react';

import { colors } from 'ts/style/colors';

interface RadioProps {
    address: string;
    value: number;
    isActive: boolean;
    onSelectAddress: (e: ChangeEvent<HTMLInputElement>) => void;
}

interface PreferenceSelecterProps extends RadioProps {
    address: string;
    balance: string;
}

interface MarkerProps {
    isActive: boolean;
}

const Radio: React.StatelessComponent<RadioProps> = ({ address, onSelectAddress, isActive, value }) => {
    return (
        <>
            <Marker isActive={isActive} />
            <RadioInput value={value} onChange={onSelectAddress} checked={isActive} />
        </>
    );
};

export const AddressTableRow: React.StatelessComponent<PreferenceSelecterProps> = ({
    address,
    balance,
    onSelectAddress,
    isActive,
    value,
}) => {
    return (
        <Wrapper isActive={isActive}>
            <Cell>
                <Label>
                    <Radio isActive={isActive} onSelectAddress={onSelectAddress} address={address} value={value} />
                    <LabelText isActive={isActive}>{address}</LabelText>
                </Label>
            </Cell>
            <Cell>
                <LabelText isActive={isActive}>{balance}</LabelText>
            </Cell>
        </Wrapper>
    );
};

AddressTableRow.defaultProps = {
    isActive: false,
};

const Wrapper = styled.tr<MarkerProps>`
    width: 100%;
    padding-bottom: 10px;
    margin-bottom: 10px;
`;

const Cell = styled.td`
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding: 10px 0;
`;

const Label = styled.label`
    cursor: pointer;
    display: flex;
    align-items: center;
`;

const LabelText = styled.span<MarkerProps>`
    color: ${props => (props.isActive ? '#003831' : '#666666')};
    font-size: 14px;
    line-height: 1;
    margin-left: 10px;
    font-weight: 400;
`;

const Marker = styled.span<MarkerProps>`
    border: 1px solid #cccccc;
    border-color: ${props => props.isActive && colors.brandLight};
    display: flex;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    position: relative;
    flex-shrink: 0;

    ${props =>
        props.isActive &&
        `
        background-color: ${colors.brandLight};
    `}
`;

const RadioInput = styled.input.attrs({
    type: 'radio',
    name: 'userAddress',
})`
    position: absolute;
    opacity: 0;
    visibility: hidden;
`;
