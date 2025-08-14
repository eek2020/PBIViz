import { Configuration } from 'webpack';

const config: Configuration = {
  mode: 'development',
  entry: './src/visual.ts',
  output: {
    filename: 'visual.js',
    path: __dirname + '/dist',
    library: 'Visual',
    libraryTarget: 'var'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/, 
        use: 'ts-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
};

export default config;
