module.exports = {
  plugins: [
    //
    // Object rest spread: SUPPORTED since v8.3.0
    // http://node.green/#ES2018-features-object-rest-spread-properties
    // But babel still needs the syntax plugin to parse so we register it here
    '@babel/plugin-syntax-object-rest-spread',
    //
    // Instance class properties: FLAG since v10.0.0
    // http://node.green/#ESNEXT-candidate--stage-3--instance-class-fields
    // Static class properties: UNSUPPORTED
    // http://node.green/#ESNEXT-draft--stage-2--static-class-fields
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    //
    // ES module: FLAG since v8.5.0
    // https://nodejs.org/api/esm.html
    ['@babel/plugin-transform-modules-commonjs', { loose: true }],
    //
    // JSX to render React in server side
    '@babel/plugin-transform-react-jsx',
  ],
  //
  // Keep line numbers to have a better log info
  retainLines: true,
};
