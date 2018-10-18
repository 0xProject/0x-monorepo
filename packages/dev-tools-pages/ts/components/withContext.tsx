import * as React from 'react';

import ThemeContext from '../context';

interface Props {
    title?: string;
    name?: string;
    subtitle?: string;
    tagline?: string;
    icon?: React.ReactNode;
    colors?: any;
}

function withContext(WrappedComponent: any) {
    function ComponentWithContext(props: any) {
        return <ThemeContext.Consumer>{data => <WrappedComponent {...data} {...props} />}</ThemeContext.Consumer>;
    }

    return ComponentWithContext;
}

export default withContext;
export { withContext, Props };
