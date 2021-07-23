module.exports = ({ env }) => ({
  email: {
    provider: 'smtp',
    providerOptions: {
      host: 'smtp.gmail.com', //SMTP Host
      port: 465   , //SMTP Port
      secure: true,
      username: env('GMAIL_EMAIL'),
      password: env('GMAIL_PASSWORD'),
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