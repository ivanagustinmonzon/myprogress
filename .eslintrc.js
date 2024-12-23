// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ["expo", "prettier"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": [
      "error",
      {
        trailingComma: 'none',
        tabWidth: 2,
        semi: false,
        singleQuote: auto
      }
    ]
  }
};
