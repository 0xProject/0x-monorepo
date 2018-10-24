import * as React from 'react';

import { SecondaryButton } from './secondary_button';

export interface RetryButtonProps {
    onClick: () => void;
}

export const RetryButton: React.StatelessComponent<RetryButtonProps> = props => {
    return <SecondaryButton text="Try Again" onClick={props.onClick} />;
};
