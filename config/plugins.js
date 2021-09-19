module.exports = ({ env }) => ({
  email: {
    provider: 'smtp',
    providerOptions: {
      host: env('SMTP_HOST'), //SMTP Host
      port: env('SMTP_PORT')   , //SMTP Port
      secure: true,
      username: env('ROBOT_EMAIL'),
      password: env('ROBOT_PASSWORD'),
      rejectUnauthorized: true,
      requireTLS: true,
      connectionTimeout: 1,
    },
    settings: {
      from: env('GMAIL_EMAIL'),
      replyTo: env('GMAIL_EMAIL'),
    },
  },
});
