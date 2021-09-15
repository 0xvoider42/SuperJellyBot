module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: ["airbnb-base"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  rules: {
    "class-methods-use-this": 0,
    "implicit-arrow-linebreak": 0,
    "no-await-in-loop": 0,
    "no-console": 0,
    "no-underscore-dangle": 0,
    "operator-linebreak": 0,
  },
};
