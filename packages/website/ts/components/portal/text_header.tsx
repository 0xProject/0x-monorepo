import { Styles } from '@0xproject/react-shared';
import * as React from 'react';

export interface TextHeaderProps {
    labelText: string;
}

const styles: Styles = {
    title: {
        fontWeight: 'bold',
        fontSize: 20,
    },
};

export const TextHeader = (props: TextHeaderProps) => {
    return (
        <div className="py3" style={styles.title}>
            {props.labelText}
        </div>
    );
};
