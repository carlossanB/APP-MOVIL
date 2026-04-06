module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Required for WatermelonDB model decorators (@field, @date, etc.)
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    'react-native-reanimated/plugin',
  ],
};
