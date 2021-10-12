module.exports = ({ env }) => ({
  email: {
    provider: "nodemailer",
    providerOptions: {
      host: env("SMTP_HOST"),
      port: env("SMTP_PORT"),
      tls: { ciphers: "SSLv3" },
      secureConnection: false,
      auth: {
        user: env("ROBOT_EMAIL"),
        pass: env("ROBOT_PASSWORD"),
      },
    },
    settings: {
      defaultFrom: env("ROBOT_EMAIL"),
      defaultReplyTo: env("HUMAN_EMAIL"),
    },
  },
});
