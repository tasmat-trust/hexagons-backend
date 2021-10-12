module.exports = ({ env }) => ({
  email: {
    provider: 'smtp',
    providerOptions: {
      host: env('SMTP_HOST'), //SMTP Host
      port: env('SMTP_PORT'), //SMTP Port
      username: env('ROBOT_EMAIL'),
      password: env('ROBOT_PASSWORD'),
      rejectUnauthorized: true,
      requireTLS: true,
      connectionTimeout: 1,
    },
    settings: {
      from: env('ROBOT_EMAIL'),
      replyTo: env('ROBOT_EMAIL'),
    },
  },
});
