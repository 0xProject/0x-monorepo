import * as _ from 'lodash';
import * as React from 'react';

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
    public componentWillMount(): void {
        // tslint:disable-next-line:no-floating-promises
        this._loadComponentFireAndForgetAsync(this.props);
    }
    public componentWillReceiveProps(nextProps: LazyComponentProps): void {
        if (nextProps.reactComponentPromise !== this.props.reactComponentPromise) {
            // tslint:disable-next-line:no-floating-promises
            this._loadComponentFireAndForgetAsync(nextProps);
        }
    }
    public render(): React.ReactNode {
        return _.isUndefined(this.state.component)
            ? null
            : React.createElement(this.state.component, this.props.reactComponentProps);
    }
    private async _loadComponentFireAndForgetAsync(props: LazyComponentProps): Promise<void> {
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
 * @example `const LazyPortal = createLazyComponent('Portal', () => import<any>('ts/containers/portal'));``
 */
export const createLazyComponent = (componentName: string, lazyImport: () => Promise<any>) => {
    return (props: any) => {
        const reactComponentPromise = (async (): Promise<React.ComponentClass<any>> => {
            const mod = await lazyImport();
            const component = mod[componentName];
            if (_.isUndefined(component)) {
                throw new Error(`Did not find exported component: ${componentName}`);
            }
            return component;
        })();
        return <LazyComponent reactComponentPromise={reactComponentPromise} reactComponentProps={props} />;
    };
};
