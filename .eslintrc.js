// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ["expo", "prettier"],
  plugins: ["prettier", "import"],
  rules: {
    "prettier/prettier": [
      "error",
      {
        trailingComma: 'none',
        tabWidth: 2,
        semi: false,
        singleQuote: auto
      }
    ],
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
