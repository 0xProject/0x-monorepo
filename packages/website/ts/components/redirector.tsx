import { constants } from 'ts/utils/constants';

interface RedirectorProps {
    location: string;
}

export function Redirector(_props: RedirectorProps): void {
    window.location.href = constants.URL_ANGELLIST;
}
