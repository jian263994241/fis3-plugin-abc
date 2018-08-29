var globals = [
  "process",
  "global",
  "window",
  "arguments",
  "__filename",
  "__dirname",
  "__getConf",
  "__uri",
  "__inline",
  "__lazyload",
  "requireExt",
  "KQB",
  "app",
  "Dom7",
  "Framework7",
  "_",
  "$$",
  "$",
  "ReactDOM",
  "React",
  "_hmt"
];

var globalsTrue = {};

globals.forEach(function(key) {
  globalsTrue[key] = true;
});


module.exports = {
  "parser": "babel-eslint",
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  "globals": globalsTrue,
  "env": {
    "browser": true,
    "commonjs": true,
    "amd": true,
    "es6": true
  },
  "parserOptions": {
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true,
      "jsx": true
    },
    "sourceType": "module"
  },
  "settings": {
    "react": {
      "version": "999.999.999"
    }
  },
  "plugins": ["react", "babel"],
  "rules": {
    "react/prop-types": "off",
    "react/display-name": "off",
    "no-console": "off",
    "no-undef": ["warn"],
    "no-unused-vars": "off",
    "linebreak-style": "off",
    "quotes": "off",
    "semi": "off"
  }
};
