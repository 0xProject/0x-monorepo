import * as React from 'react';

interface FilteredPropsInterface {
    [key: string]: any;
}

export const withFilteredProps = (Component: React.ComponentType<any>, allowedProps: string[]) =>
    class WithFilteredProps extends React.Component<FilteredPropsInterface> {
        constructor(props: FilteredPropsInterface) {
            super(props);
        }
        public filterProps(): any {
            const props = this.props;
            /* tslint:disable:no-any */
            const filteredProps: FilteredPropsInterface = {};
            let key;

            for (key in this.props) {
                if (allowedProps.includes(key)) {
                    /* tslint:disable:no-any */
                    filteredProps[key] = props[key];
                }
            }

            /* tslint:disable:no-any */
            return filteredProps;
        }
        public render(): React.ReactNode {
            const filteredProps = this.filterProps();
            return <Component {...filteredProps}>{this.props.children}</Component>;
        }
    };
