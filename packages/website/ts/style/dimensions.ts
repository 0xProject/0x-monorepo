import * as React from 'react';

interface DimensionObject {
    width: number;
    height: number;
    top: number;
    left: number;
    x: number;
    y: number;
    right: number;
    bottom: number;
}

type UseDimensionsHook = [(node: HTMLElement) => void, {} | DimensionObject, HTMLElement];

interface UseDimensionsArgs {
    isLiveMeasure?: boolean;
}

function getDimensionObject(node: HTMLElement): DimensionObject {
    const rect = node.getBoundingClientRect();

    return {
        width: rect.width,
        height: rect.height,
        top: 'x' in rect ? rect.x : rect.top,
        left: 'y' in rect ? rect.y : rect.left,
        x: 'x' in rect ? rect.x : rect.left,
        y: 'y' in rect ? rect.y : rect.top,
        right: rect.right,
        bottom: rect.bottom,
    };
}

export function useDimensions({ isLiveMeasure = true }: UseDimensionsArgs = {}): UseDimensionsHook {
    const [dimensions, setDimensions] = React.useState({});
    const [node, setNode] = React.useState(null);

    const ref = React.useCallback(_node => {
        setNode(_node);
    }, []);

    React.useLayoutEffect(// @ts-ignore
    () => {
        if (node) {
            const measure = () => window.requestAnimationFrame(() => setDimensions(getDimensionObject(node)));
            measure();

            if (isLiveMeasure) {
                window.addEventListener('resize', measure);
                window.addEventListener('scroll', measure);

                return () => {
                    window.removeEventListener('resize', measure);
                    window.removeEventListener('scroll', measure);
                };
            }
        }
    }, [node]);

    return [ref, dimensions, node];
}
