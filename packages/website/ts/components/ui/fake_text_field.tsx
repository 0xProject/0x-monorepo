import * as React from 'react';
import { InputLabel } from 'ts/components/ui/input_label';
import { Styles } from 'ts/types';

const styles: Styles = {
    hr: {
        borderBottom: '1px solid rgb(224, 224, 224)',
        borderLeft: 'none rgb(224, 224, 224)',
        borderRight: 'none rgb(224, 224, 224)',
        borderTop: 'none rgb(224, 224, 224)',
        bottom: 6,
        boxSizing: 'content-box',
        margin: 0,
        position: 'absolute',
        width: '100%',
    },
};

interface FakeTextFieldProps {
    label?: React.ReactNode | string;
    children?: any;
}

export const FakeTextField = (props: FakeTextFieldProps) => {
    return (
        <div className="relative">
            {props.label !== '' && <InputLabel text={props.label} />}
            <div className="pb2" style={{ height: 23 }}>
                {props.children}
            </div>
            <hr style={styles.hr} />
        </div>
    );
};
