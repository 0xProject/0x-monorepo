import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

interface VoteBarProps {
    label: string;
    color: string;
    percentage: BigNumber;
    marginBottom?: string;
}

interface VoteColumnProps {
    color: string;
    width: string;
}

const buildVotePercentageLabel = (percentage: BigNumber): string => {
    let percentageLabel = `${percentage.toFixed(0)}%`;
    // When voting is entirely dominated it can result in showing 100% and 0%
    // In this case we replace with an indication that there are some votes for
    // the minority
    if (percentage.isGreaterThan(99) && percentage.isLessThan(100)) {
        percentageLabel = `> 99%`;
    } else if (percentage.isGreaterThan(0) && percentage.isLessThan(1)) {
        percentageLabel = `< 1%`;
    }
    return percentageLabel;
};

export const VoteBar: React.StatelessComponent<VoteBarProps> = ({ percentage, color, label, marginBottom }) => {
    // TODO convert this to use a Container component
    return (
        <Wrapper marginBottom={marginBottom}>
            <VoteColumnPrefix>{label}</VoteColumnPrefix>
            <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
                <VoteColumn color={color} width={percentage.toFixed(0)} />
                <VoteColumnLabel>{buildVotePercentageLabel(percentage)}</VoteColumnLabel>
            </div>
        </Wrapper>
    );
};

const VoteColumn = styled.div<VoteColumnProps>`
    background-color: ${props => props.color};
    width: calc(${props => props.width}% - 45px);
    height: 13px;
    margin-right: 15px;
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
    min-width: 60px;
`;
