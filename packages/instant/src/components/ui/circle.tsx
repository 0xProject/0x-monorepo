import * as React from 'react';

export interface CircleProps {
    className?: string;
    diameter: number;
    fillColor: string;
}

export const Circle: React.StatelessComponent<CircleProps> = ({ className, diameter, fillColor }) => {
    const radius = diameter / 2;
    return (
        <svg className={className} height={diameter} width={diameter}>
            <circle cx={radius} cy={radius} r={radius} fill={fillColor} />
        </svg>
    );
};
