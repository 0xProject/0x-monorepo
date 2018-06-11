import * as React from 'react';

export interface BulletedItemProps {
    bulletColor: string;
    title: string;
    description: string;
    height?: number;
}
export const BulletedItem = (props: BulletedItemProps) => {
    const minHeight = props.height || 150;
    return (
        <div className="flex" style={{ minHeight }}>
            <svg className="flex-none px2" height="26" width="26">
                <circle cx="13" cy="13" r="13" fill={props.bulletColor} />
            </svg>
            <div className="flex-auto px2">
                <div style={{ paddingTop: 3, fontWeight: 'bold', fontSize: 16 }}>{props.title}</div>
                <div style={{ paddingTop: 12, fontSize: 16, lineHeight: 2 }}>{props.description}</div>
            </div>
        </div>
    );
};
