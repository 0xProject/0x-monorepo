import * as React from 'react';
import { constants } from 'ts/utils/constants';

interface RedirecterProps {
    location: string;
}

export function Redirecter(props: RedirecterProps) {
    window.location.href = constants.URL_ANGELLIST;
}
