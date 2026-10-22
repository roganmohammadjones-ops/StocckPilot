// Only the dedicated GitHub Pages export sets this value. Native builds and
// existing root-hosted web deployments continue to use app.json unchanged.
module.exports = ({ config }) => {
  const baseUrl = process.env.STOCKPILOT_WEB_BASE_PATH;
  if (!baseUrl) return config;

  return {
    ...config,
    experiments: { ...config.experiments, baseUrl },
  };
};
