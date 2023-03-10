module.exports = ({ env }) => ({
  host: "0.0.0.0",
  url: env("CUSTOM_URL") ?? env("RENDER_EXTERNAL_URL"),
  admin: {
    auth: {
      secret: env("ADMIN_JWT_SECRET"),
    },
  },
});
