const path = require('path');

module.exports = {
	mode: 'production',
	entry: './docs/main.js',
	output: {
		path: path.join(__dirname, 'docs'),
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