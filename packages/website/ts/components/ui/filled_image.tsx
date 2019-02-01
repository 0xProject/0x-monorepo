import * as React from 'react';

export interface FilledImageProps {
    src: string;
}
export const FilledImage = (props: FilledImageProps) => (
    <div
        style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundImage: `url(${props.src})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
        }}
    />
);
