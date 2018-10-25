import * as React from 'react';

import { SecondaryButton, SecondaryButtonProps } from './secondary_button';

export interface RetryButtonProps extends SecondaryButtonProps {
    onClick: () => void;
}

export const RetryButton: React.StatelessComponent<RetryButtonProps> = props => {
    return <SecondaryButton {...props}>Try Again</SecondaryButton>;
};
