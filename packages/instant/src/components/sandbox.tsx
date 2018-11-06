import * as React from 'react';

import { MediaChoice, stylesForMedia } from '../style/media';
import { styled } from '../style/theme';

// export const Sandbox: React.StatelessComponent<{}> = props => {
//     return <div>Hi</div>;
// };

// TODO: handle string too
interface SandboxProps {
    width: MediaChoice;
}
export const Sandbox =
    styled.div <
    SandboxProps >
    `
    display: block;
    border: 1px solid black;
    background-color: yellow;
    ${props => stylesForMedia(props.width)}
    `;
