import { colors, Styles } from '@0x/react-shared';
import * as React from 'react';

export interface InputLabelProps {
    text: string | Element | React.ReactNode;
}

const styles: Styles = {
    label: {
        color: colors.grey,
        fontSize: 12,
        pointerEvents: 'none',
        textAlign: 'left',
        transform: 'scale(0.75) translate(0px, -28px)',
        transformOrigin: 'left top 0px',
        transition: 'all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms',
        userSelect: 'none',
        width: 240,
        zIndex: 1,
    } as React.CSSProperties,
};

export const InputLabel = (props: InputLabelProps) => {
    return <label style={styles.label}>{props.text}</label>;
};
