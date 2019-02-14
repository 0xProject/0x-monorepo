import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

// tslint:disable-next-line: no-duplicate-imports
import { ChangeEvent } from 'react';

import { colors } from 'ts/style/colors';

interface RadioProps {
    value: string;
    isActive: boolean;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

interface PreferenceSelecterProps extends RadioProps {
    label: string;
}

interface MarkerProps {
    isActive: boolean;
}

const Radio: React.StatelessComponent<RadioProps> = ({ value, onChange, isActive }) => {
    return (
        <>
            <Marker isActive={isActive} />
            <RadioInput value={value} onChange={onChange} checked={isActive} />
        </>
    );
};

export const PreferenceSelecter: React.StatelessComponent<PreferenceSelecterProps> = ({
    label,
    value,
    onChange,
    isActive,
}) => {
    return (
        <Wrapper isActive={isActive}>
            <Label>
                <Radio isActive={isActive} onChange={onChange} value={value} />
                <LabelText isActive={isActive}>{label}</LabelText>
            </Label>
        </Wrapper>
    );
};

PreferenceSelecter.defaultProps = {
    isActive: false,
};

const Wrapper = styled.div<MarkerProps>`
    border: 2px solid #7a7a7a;
    border-color: ${props => props.isActive && colors.brandLight};
    width: 100%;
    margin-bottom: 30px;
`;

const Label = styled.label`
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 28px 30px;
`;

const LabelText = styled.span<MarkerProps>`
    color: ${props => (props.isActive ? colors.brandLight : '#7A7A7A')};
    font-size: 20px;
    line-height: 1;
    margin-left: 30px;
    font-weight: 400;
`;

const Marker = styled.span<MarkerProps>`
    border: 2px solid #7a7a7a;
    border-color: ${props => props.isActive && colors.brandLight};
    display: flex;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    position: relative;

    ${props =>
        props.isActive &&
        `
        &:after {
            background-color: ${colors.brandLight};
            border-radius: 50%;
            content: '';
            margin: auto;
            width: calc(30px - 12px);
            height: calc(30px - 12px);
        }
    `}
`;

const RadioInput = styled.input.attrs({
    type: 'radio',
    name: 'votePreference',
})`
    position: absolute;
    opacity: 0;
    visibility: hidden;
`;
