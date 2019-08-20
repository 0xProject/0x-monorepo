import * as React from 'react';
import ReactTooltip from 'react-tooltip';
import styled from 'styled-components';

import { Icon } from 'ts/components/icon';

const InfoTooltipContainer = styled.div`
    cursor: pointer;
`;
const Tooltip = styled.div`
    max-width: 250px;
    padding: 5px;
`;

export interface InfoTooltipProps {
    id: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = props => {
    return (
        <InfoTooltipContainer>
            <ReactTooltip id={props.id} type="light">
                <Tooltip>{props.children}</Tooltip>
            </ReactTooltip>
            <div data-tip={true} data-for={props.id}>
                <Icon name="info" size="natural" />
            </div>
        </InfoTooltipContainer>
    );
};
