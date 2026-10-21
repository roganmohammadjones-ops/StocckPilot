const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  { ignores: ['dist/**', '.expo/**', '.agents/**'] },
]);
