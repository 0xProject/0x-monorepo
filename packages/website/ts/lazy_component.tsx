import * as React from 'react';
import * as _ from 'lodash';

interface LazyComponentProps {
    reactComponentPromise: Promise<React.ComponentClass<any>>;
    reactComponentProps: any;
}

interface LazyComponentState {
    component?: React.ComponentClass<any>;
}

/**
 * This component is used for rendering components that are lazily loaded from other chunks.
 * Source: https://reacttraining.com/react-router/web/guides/code-splitting
 */
export class LazyComponent extends React.Component<LazyComponentProps, LazyComponentState> {
    constructor(props: LazyComponentProps) {
        super(props);
        this.state = {
            component: undefined,
        };
    }
    public componentWillMount() {
        this.loadComponentFireAndForgetAsync(this.props);
    }
    public componentWillReceiveProps(nextProps: LazyComponentProps) {
        if (nextProps.reactComponentPromise !== this.props.reactComponentPromise) {
            this.loadComponentFireAndForgetAsync(nextProps);
        }
    }
    public render() {
        return _.isUndefined(this.state.component) ?
                null :
                React.createElement(this.state.component, this.props.reactComponentProps);
    }
    private async loadComponentFireAndForgetAsync(props: LazyComponentProps) {
        const component = await props.reactComponentPromise;
        this.setState({
            component,
        });
    }
}

/**
 * [createLazyComponent description]
 * @param  componentName    name of exported component
 * @param  lazyImport       lambda returning module promise
 *                          we pass a lambda because we only want to require a module if it's used
 * @example `const LazyPortal = createLazyComponent('Portal', () => System.import<any>('ts/containers/portal'));``
 */
export const createLazyComponent = (componentName: string, lazyImport: () => Promise<any>) => {
    return (props: any) => {
        const reactComponentPromise = (async (): Promise<React.ComponentClass<any>> => {
            const mod = await lazyImport();
            const component = mod[componentName];
            return component;
        })();
        return (
            <LazyComponent
                reactComponentPromise={reactComponentPromise}
                reactComponentProps={props}
            />
        );
    };
};
