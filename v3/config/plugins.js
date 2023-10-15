module.exports = ({ env }) => ({
  graphql: {
    endpoint: '/graphql',
    shadowCRUD: true,
    playgroundAlways: false,
    depthLimit: 7,
    amountLimit: 2500,
    shareEnabled: false,
    federation: false,
    apolloServer: {
      tracing: false,
    },
  },
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
 