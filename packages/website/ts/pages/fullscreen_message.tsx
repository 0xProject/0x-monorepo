import { Styles } from '@0x/react-shared';
import * as React from 'react';

export interface FullscreenMessageProps {
    headerText: string;
    bodyText: string;
}

const styles: Styles = {
    thin: {
        fontWeight: 100,
    },
};

export const FullscreenMessage = (props: FullscreenMessageProps) => {
    return (
        <div className="mx-auto max-width-4 py4">
            <div className="center py4">
                <div className="py4">
                    <div className="py4">
                        <h1 style={styles.thin}>{props.headerText}</h1>
                        <div className="py1">
                            <div className="py3">{props.bodyText}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
