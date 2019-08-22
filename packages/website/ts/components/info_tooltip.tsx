import * as React from 'react';
import ReactTooltip from 'react-tooltip';
import styled from 'styled-components';

import { Icon } from 'ts/components/icon';

const InfoTooltipContainer = styled.div<InfoTooltipProps>`
    cursor: pointer;
    position: relative;
    left: ${props => props.left || '0px'};
`;
const Tooltip = styled.div`
    max-width: 250px;
    padding: 5px;
`;

export interface InfoTooltipProps {
    id: string;
    left?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = props => {
    return (
        <InfoTooltipContainer {...props}>
            <ReactTooltip id={props.id} type="light">
                <Tooltip>{props.children}</Tooltip>
            </ReactTooltip>
            <div data-tip={true} data-for={props.id}>
                <Icon name="info" size="natural" />
            </div>
        </InfoTooltipContainer>
    );
};
