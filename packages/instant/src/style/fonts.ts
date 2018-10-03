import { injectGlobal } from './theme';

export const fonts = {
    include: () => {
        // Inject the inter-ui font into the page
        return injectGlobal`
            @import url('https://rsms.me/inter/inter-ui.css');
        `;
    },
};
