const highlight = require('highlight.js/lib/highlight');
const javascript = require('highlight.js/lib/languages/javascript');
const json = require('highlight.js/lib/languages/json');

highlight.registerLanguage('javascript', javascript);
highlight.registerLanguage('json', json);

export default highlight;
