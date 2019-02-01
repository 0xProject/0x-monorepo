import * as React from 'react';

export interface SectionProps {
    header: React.ReactNode;
    body: React.ReactNode;
}
export const Section = (props: SectionProps) => {
    return (
        <div className="flex flex-column">
            {props.header}
            {props.body}
        </div>
    );
};
