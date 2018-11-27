import * as _ from 'lodash';
import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { colors } from 'ts/style/colors';
import { ScreenWidths } from 'ts/types';

export interface ScreenshotsProps {
    screenWidth: ScreenWidths;
}

export const Screenshots = (props: ScreenshotsProps) => {
    const isSmallScreen = props.screenWidth === ScreenWidths.Sm;
    const images = isSmallScreen
        ? [
              'images/instant/rep_screenshot.png',
              'images/instant/dai_screenshot.png',
              'images/instant/gods_screenshot.png',
          ]
        : [
              'images/instant/nmr_screenshot.png',
              'images/instant/kitty_screenshot.png',
              'images/instant/rep_screenshot.png',
              'images/instant/dai_screenshot.png',
              'images/instant/gods_screenshot.png',
              'images/instant/gnt_screenshot.png',
          ];
    return (
        <Container backgroundColor={colors.instantPrimaryBackground} className="py3 flex justify-center">
            {_.map(images, image => {
                return <img className="px1" width="300px" height="420px" src={image} />;
            })}
        </Container>
    );
};
