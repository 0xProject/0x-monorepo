export const fonts = {
    include: () => {
        // Inject the inter-ui font into the page
        const appendTo = document.head || document.getElementsByTagName('head')[0] || document.body;
        const style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(`@import url('https://rsms.me/inter/inter-ui.css')`));
        appendTo.appendChild(style);
    },
};
