import * as React from 'react';

export interface SectionProps {
    header: React.ReactNode;
    body: React.ReactNode;
}
export const Section = (props: SectionProps) => {
    return (
        <div className="flex flex-column" style={{ height: '100%' }}>
            {props.header}
            <div className="flex-auto">{props.body}</div>
        </div>
    );
};
