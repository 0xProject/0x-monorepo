import * as React from 'react';

import { MediaChoice, stylesForMedia } from '../style/media';
import { styled } from '../style/theme';

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
