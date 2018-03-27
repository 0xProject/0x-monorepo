propsParserOpts = {
  skipPropsWithoutDoc: true
};

module.exports = {
  assetsDir: './public',
  propsParser: require('react-docgen-typescript').withCustomConfig('./tsconfig.json', [propsParserOpts]).parse,
  components: 'src/components/**/*.{ts,tsx}',
  webpackConfig: require('./config/webpack.config.dev.js'),
  sections: [
    {
      "name": "App",
      "components": "src/App.tsx",
    },
    {
      "name": "AccountBlockie",
      "content": "src/components/AccountBlockie/AccountBlockie.md",
      "components": "src/components/AccountBlockie/index.ts",
    },
    {
      "name": "TokenSelector",
      "content": "src/components/TokenSelector/TokenSelector.md",
      "components": "src/components/TokenSelector/index.ts",
    },
    {
      "name": "BuyWidget",
      "content": "src/components/BuyWidget/BuyWidget.md",
      "components": "src/components/BuyWidget/index.ts",
    }
  ]
}
