import * as React from 'react';
import { Container } from 'ts/components/ui/container';
import { Spinner } from 'ts/components/ui/spinner';
import { colors } from 'ts/utils/colors';

export enum AllowanceState {
    Locked,
    Unlocked,
    Loading,
}

export interface AllowanceStateViewProps {
    allowanceState: AllowanceState;
}

export const AllowanceStateView: React.StatelessComponent<AllowanceStateViewProps> = ({ allowanceState }) => {
    switch (allowanceState) {
        case AllowanceState.Locked:
            return renderLock();
        case AllowanceState.Unlocked:
            return renderCheck();
        case AllowanceState.Loading:
            return (
                <Container position="relative" top="3px" left="5px">
                    <Spinner size={18} strokeSize={2} />
                </Container>
            );
        default:
            return null;
    }
};

const renderCheck = (color: string = colors.lightGreen) => (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8.5" cy="8.5" r="8.5" fill={color} />
        <path
            d="M2.5 4.5L1.79289 5.20711L2.5 5.91421L3.20711 5.20711L2.5 4.5ZM-0.707107 2.70711L1.79289 5.20711L3.20711 3.79289L0.707107 1.29289L-0.707107 2.70711ZM3.20711 5.20711L7.70711 0.707107L6.29289 -0.707107L1.79289 3.79289L3.20711 5.20711Z"
            transform="translate(5 6.5)"
            fill="white"
        />
    </svg>
);

const renderLock = () => (
    <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M6 0C3.51604 0 1.48688 2.0495 1.48688 4.55837V5.86581C0.664723 5.86581 -3.33647e-08 6.53719 -3.33647e-08 7.36759V13.3217C-3.33647e-08 14.1521 0.664723 14.8235 1.48688 14.8235H10.5131C11.3353 14.8235 12 14.1521 12 13.3217V7.36759C12 6.53719 11.3353 5.86581 10.5131 5.86581V4.55837C10.5131 2.0495 8.48396 0 6 0ZM8.93878 5.86581H3.06122V4.55837C3.06122 2.9329 4.37318 1.59013 6 1.59013C7.62682 1.59013 8.93878 2.9329 8.93878 4.55837V5.86581Z"
            fill="black"
        />
    </svg>
);
