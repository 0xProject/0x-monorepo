import * as React from 'react';

export interface FloatingImageProps {
    src: string;
}
export const FloatingImage = (props: FloatingImageProps) => {
    return <img src={props.src} style={{ width: '100%' }} />;
};
