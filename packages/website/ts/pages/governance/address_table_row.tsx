import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { CheckMark } from 'ts/components/ui/check_mark';
import { colors } from 'ts/style/colors';

interface RadioProps {
    address: string;
    value: number;
    isActive: boolean;
    onSelectAddress: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
            <CheckMark isChecked={isActive} color={colors.brandLight} />
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
            <Cell isRightAligned={true}>
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

const Cell = styled.td<{ isRightAligned?: boolean }>`
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding: 10px 0;
    font-size: 14px;
    vertical-align: middle;
    text-align: ${props => props.isRightAligned && 'right'};
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

const RadioInput = styled.input.attrs({
    type: 'radio',
    name: 'userAddress',
})`
    position: absolute;
    opacity: 0;
    visibility: hidden;
`;
