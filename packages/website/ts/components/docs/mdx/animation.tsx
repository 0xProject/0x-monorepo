import * as React from 'react';
import styled from 'styled-components';

import { docs } from 'ts/style/docs';

const AnimationLoaderLazy = React.lazy(async () =>
    import('ts/components/docs/animations/animation_loader').then(({ AnimationLoader }) => ({
        default: AnimationLoader,
    })),
);

interface IAnimationProps extends IAnimationWrapperProps {
    name: string;
}

interface IAnimationWrapperProps {
    height?: string;
    width?: string;
    padding?: string;
    margin?: string;
    marginBottom?: string;
}

// Note (piotr): I am lazy loading the animation loader to not include lottie animation library in the bundle.
// In the animation loader I lazy load the json file for the animation itself - not sure if that is needed if I already lazy load here

export const Animation: React.FC<IAnimationProps> = ({ name, ...props }) => {
    return (
        <React.Suspense fallback={<React.Fragment />}>
            <AnimationWrapper {...props}>
                <AnimationLoaderLazy name={name} />
            </AnimationWrapper>
        </React.Suspense>
    );
};

Animation.defaultProps = {
    width: '620px',
    marginBottom: docs.marginBottom,
};

const AnimationWrapper = styled.div<IAnimationWrapperProps>`
    margin: 0 auto;
    height: ${props => props.height};
    max-width: ${props => props.width};
    padding: ${props => props.padding};
    margin: ${props => props.margin};
    margin-bottom: ${props => props.marginBottom};
`;
