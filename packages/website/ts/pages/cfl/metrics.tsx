import * as React from 'react';
import styled from 'styled-components';

import { Paragraph } from 'ts/components/text';

const MetricsContainer = styled.div`
    padding: 20px;
    background-color: ${props => props.theme.darkBgColor};
    width: 100%;
`;

const MetricValueContainer = styled.div`
    display: flex;
    justify-content: space-between;
`;

export interface MetricValue {
    label?: React.ReactNode;
    value: string;
}

interface MetricsProps {
    title: string;
    metrics: MetricValue[];
}

export const Metrics: React.FC<MetricsProps> = props => (
    <MetricsContainer>
        <Paragraph marginBottom="15px" size="small">
            {props.title}
        </Paragraph>
        <MetricValueContainer>
            {props.metrics.map((metric, index) => (
                <div key={`metric-${index}`}>
                    {metric.label && <div>{metric.label}</div>}
                    <Paragraph isNoMargin={true} isMuted={1} size="large" color="white">
                        {metric.value}
                    </Paragraph>
                </div>
            ))}
        </MetricValueContainer>
    </MetricsContainer>
);
