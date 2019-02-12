import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface VoteBarProps {
    label: string;
    color: string;
    percentage: number;
    marginBottom?: string;
}

interface VoteColumnProps {
    color: string;
    width: number;
}

export const VoteBar: React.StatelessComponent<VoteBarProps> = ({ percentage, color, label, marginBottom }) => {
    const percentageLabel = `${percentage}%`;

    return (
        <Wrapper marginBottom={marginBottom}>
            <VoteColumnPrefix>{label}</VoteColumnPrefix>
            <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
                <VoteColumn color={color} width={percentage} />
                <VoteColumnLabel>{percentageLabel}</VoteColumnLabel>
            </div>
        </Wrapper>
    );
};

const VoteColumn = styled.div<VoteColumnProps>`
    background-color: ${props => props.color};
    width: calc(${props => props.width}% - 45px);
    height: 13px;
    margin-right: 10px;
    min-width: 10px;
`;

const Wrapper = styled.div<{ marginBottom?: string }>`
    display: flex;
    align-items: center;
    margin-bottom: ${props => props.marginBottom || '12px'};
`;

const VoteColumnPrefix = styled.span`
    font-size: 1rem;
    line-height: 1;
    width: 40px;
    margin-right: 5px;
    font-weight: 300;
`;

const VoteColumnLabel = styled.span`
    font-size: 1rem;
    line-height: 1;
    font-weight: 300;
`;
