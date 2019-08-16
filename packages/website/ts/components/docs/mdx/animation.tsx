import * as React from 'react';

const AnimationLoader = React.lazy(async () =>
    import('ts/components/docs/animations/animation_loader').then(({ AnimationLoader }) => ({
        default: AnimationLoader,
    })),
);

interface IAnimationProps {
    name: string;
}

// Note (piotr): I am lazy loading the animation loader to not include lottie animation library in the bundle.
// In the animation loader I lazy load the json file for the animation itself - not sure if that is needed if I already lazy load here

export const Animation: React.FC<IAnimationProps> = ({ name }) => {
    return (
        <React.Suspense fallback={<React.Fragment />}>
            <AnimationLoader name={name} />
        </React.Suspense>
    );
};
