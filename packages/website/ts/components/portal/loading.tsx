import CircularProgress from 'material-ui/CircularProgress';
import * as React from 'react';

const CIRCULAR_PROGRESS_SIZE = 40;
const CIRCULAR_PROGRESS_THICKNESS = 5;

export interface LoadingProps {
    isLoading: boolean;
    content: React.ReactNode;
}
export const Loading = (props: LoadingProps) => {
    if (props.isLoading) {
        return (
            <div className="center">
                <CircularProgress size={CIRCULAR_PROGRESS_SIZE} thickness={CIRCULAR_PROGRESS_THICKNESS} />
            </div>
        );
    } else {
        return <div>{props.content}</div>;
    }
};
