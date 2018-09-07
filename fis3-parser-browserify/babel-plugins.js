

module.exports = [
  //styled-components
  [require.resolve('babel-plugin-styled-components'), { displayName: false }],

  //decorators
  [require.resolve('@babel/plugin-proposal-decorators'), {legacy: true}],
  [require.resolve('@babel/plugin-proposal-class-properties'), {loose: true}],

  //runtime
  require.resolve('@babel/plugin-transform-runtime'),

  //object-assign
  require.resolve('@babel/plugin-transform-object-assign'),

  //stage0
  require('@babel/plugin-proposal-function-bind'),

  // Stage 1
  require.resolve('@babel/plugin-proposal-export-default-from'),
  require.resolve('@babel/plugin-proposal-logical-assignment-operators'),
  [require.resolve('@babel/plugin-proposal-optional-chaining'), { "loose": false }],
  [require.resolve('@babel/plugin-proposal-pipeline-operator'), { "proposal": "minimal" }],
  [require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'), { "loose": false }],
  require.resolve('@babel/plugin-proposal-do-expressions'),

  // Stage 2
  require.resolve('@babel/plugin-proposal-function-sent'),
  require.resolve('@babel/plugin-proposal-export-namespace-from'),
  require.resolve('@babel/plugin-proposal-numeric-separator'),
  require.resolve('@babel/plugin-proposal-throw-expressions'),

  // Stage 3
  require.resolve('@babel/plugin-syntax-dynamic-import'),
  require.resolve('@babel/plugin-syntax-import-meta'),
  require.resolve('@babel/plugin-proposal-json-strings')
]
