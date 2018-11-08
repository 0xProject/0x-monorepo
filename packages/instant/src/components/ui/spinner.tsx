import * as React from 'react';

import { FullRotation } from '../animations/full_rotation';

export interface SpinnerProps {
    widthPx: number;
    heightPx: number;
}
export const Spinner: React.StatelessComponent<SpinnerProps> = props => {
    return (
        <FullRotation width={`${props.widthPx}px`} height={`${props.heightPx}px`}>
            <svg
                width={props.widthPx}
                height={props.heightPx}
                viewBox="0 0 34 34"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle cx="17" cy="17" r="15" stroke="white" strokeOpacity="0.2" strokeWidth="4" />
                <path
                    d="M17 32C25.2843 32 32 25.2843 32 17C32 8.71573 25.2843 2 17 2"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </FullRotation>
    );
};
