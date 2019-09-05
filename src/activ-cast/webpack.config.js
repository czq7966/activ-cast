const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = env => {
    env = env ? env : {}; //环境变量
    const mode = env.production ? "production" : "development"; //开发或生产模式
    const devtool = env.production || env.nodevtool ? "" : "source-map"; //    
    const entry = {}; 
    const plugins = [];
    const optimization = {};  //优化选项
    const minimizer = []; //优化选项：瘦身器
    const libraryTarget = env.amd ? 'amd' : env.umd ? 'umd' :  env.cjs ? 'commonjs' : env.old ? 'umd' : 'commonjs';
    // const libraryTargetPath =  env.amd ? 'amd' : env.umd ? 'umd' : env.cjs ? 'cjs' : env.old ? '' : 'cjs';
    // const distDir = path.resolve(__dirname, 'dist', libraryTargetPath);
    const distDir = path.resolve(__dirname, '../../dist/screen-share');
    const srcDir =  path.resolve(__dirname);

    entry['background/index'] = path.resolve(srcDir, process.env.NODE_MODE == "dev" ? "background/index-dev.ts" : "background/index.ts");
    entry['pages/dropdown/index'] = path.resolve(srcDir, process.env.NODE_MODE == "dev" ? "pages/dropdown/index-dev.tsx" : "pages/dropdown/index.tsx");
    // entry['pages/dropdown/options'] = path.resolve(srcDir, "pages/dropdown/options.tsx");
    optimization['minimizer'] = minimizer;  

    plugins.push(
        new CopyWebpackPlugin([
            {
                from: path.resolve(srcDir, 'manifest.json'),
                to: 'manifest.json',
            },   
            // {
            //     from: path.resolve(srcDir, 'README.txt'),
            //     to: 'README.txt',
            // },                      
            {
                from: path.resolve(srcDir, 'pages/dropdown/index.html'),
                to: 'pages/dropdown/index.html',
            },
            // {
            //     from: path.resolve(srcDir, 'pages/dropdown/options.html'),
            //     to: 'pages/dropdown/options.html',
            // },          
            // {
            //     from: path.resolve(srcDir, 'pages/test/test.html'),
            //     to: 'pages/test/test.html',
            // },                
            {
                from: path.resolve(srcDir, 'images'),
                to: 'images',
            },                
            {
                from: path.resolve(srcDir, '_locales'),
                to: '_locales',
            }         
        ])
    )

    if (env.minimize) { //生产模式
        optimization['minimizer'] = undefined;
        // minimizer.push(
        //     new UglifyJsPlugin()
        // )
    }


    return {
        mode: mode,
        entry: entry,
        devtool: devtool,
        output: {
            path: distDir,
            libraryTarget: libraryTarget,
            filename: "[name].js"
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js"]
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: "ts-loader",
                    exclude: /node_modules/
                },
                {
                    test: /\.css$/,
                    loader: "style-loader!css-loader",
                    exclude: /node_modules/
                },
                {
                    test: /\.(png|svg|jpg|gif)$/,
                    loader: "url-loader",
                    exclude: /node_modules/
                },                 
            ]
        },
        plugins: plugins,
        optimization: optimization,
        plugins: plugins
    }
}

