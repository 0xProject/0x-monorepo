import * as _ from 'lodash';

export const util = {
    boundNoop: _.noop.bind(_),
    createOpenUrlInNewWindow: (href: string) => () => window.open(href, '_blank'),
};
