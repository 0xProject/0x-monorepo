import CircularProgress from 'material-ui/CircularProgress';
import * as React from 'react';

export interface SimpleLoadingProps {
    message: string;
}

export const SimpleLoading = (props: SimpleLoadingProps) => {
    return (
        <div className="mx-auto pt3" style={{ maxWidth: 400, height: 409 }}>
            <div className="relative" style={{ top: '50%', transform: 'translateY(-50%)', height: 95 }}>
                <CircularProgress />
                <div className="pt3 pb3">{props.message}</div>
            </div>
        </div>
    );
};
