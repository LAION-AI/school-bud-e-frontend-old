export default {
  e2e: {
    baseUrl: "http://localhost:8000",
    supportFile: false,
    specPattern: "cypress/e2e/**/*.{js,jsx,ts,tsx}",
    video: false,
    screenshotOnRunFailure: false,
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
};
