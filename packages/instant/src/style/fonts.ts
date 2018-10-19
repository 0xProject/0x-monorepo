export const fonts = {
    include: () => {
        // Inject the inter-ui font into the page
        const head = document.head || document.getElementsByTagName('head')[0];
        const style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(`@import url('https://rsms.me/inter/inter-ui.css')`));
        head.appendChild(style);
    },
};
