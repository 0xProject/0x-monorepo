import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { colors } from 'ts/style/colors';

export const Screenshots = () => (
    <Container backgroundColor={colors.instantPrimaryBackground} className="py3 flex justify-center">
        <img className="px1" width="300px" height="420px" src="images/instant/snt_screenshot.png" />
        <img className="px1" width="300px" height="420px" src="images/instant/omg_screenshot.png" />
        <img className="px1" width="300px" height="420px" src="images/instant/kitty_screenshot.png" />
        <img className="px1" width="300px" height="420px" src="images/instant/bat_screenshot.png" />
        <img className="px1" width="300px" height="420px" src="images/instant/leroy_screenshot.png" />
        <img className="px1" width="300px" height="420px" src="images/instant/mkr_screenshot.png" />
    </Container>
);
