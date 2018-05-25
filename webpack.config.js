const path = require('path');

module.exports = {
	mode: 'production',
	entry: './main.js',
	output: {
		path: __dirname,
		filename: '[name].bundle.js'
	},
	module: {
		rules: [{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader'
		}]
	}
}