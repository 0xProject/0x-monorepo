const highlight = require('highlight.js/lib/highlight');
const javascript = require('highlight.js/lib/languages/javascript');

highlight.registerLanguage('javascript', javascript);

export default highlight;
