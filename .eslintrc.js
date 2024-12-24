// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ["expo"],
  plugins: ["import"],
  rules: {
    "indent": ["error", 2],
    "import/order": [
      "error",
      {
        groups: ["external", "internal"],
        pathGroups: [
          {
            pattern: "@/src/**",
            group: "internal",
            position: "before",
          },
        ],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        }
      }
    ]
  }
};
