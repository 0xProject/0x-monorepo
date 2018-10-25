import * as React from 'react';

import { SecondaryButton, SecondaryButtonProps } from './secondary_button';

export interface ViewTransactionButtonProps extends SecondaryButtonProps {
    onClick: () => void;
}

export const ViewTransactionButton: React.StatelessComponent<ViewTransactionButtonProps> = props => {
    return <SecondaryButton {...props}>View Transaction</SecondaryButton>;
};
