var path = require('path');

module.exports = {
  devServer: {
    contentBase: path.join(__dirname, '/src'),
    compress: true,
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api/': {
        target: 'http://localhost:5000/',
        secure: false,
        logLevel: 'debug',
        changeOrigin: true,
        xfwd: true
      }
}
  }
};
