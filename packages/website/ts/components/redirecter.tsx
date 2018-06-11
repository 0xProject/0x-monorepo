import { constants } from 'ts/utils/constants';

interface RedirecterProps {
    location: string;
}

export function Redirecter(_props: RedirecterProps): void {
    window.location.href = constants.URL_ANGELLIST;
}
