module.exports = ({ env }) => ({
  email: {
    provider: 'nodemailer',
    providerOptions: {
      host: env('SMTP_HOST'),
      port: env('SMTP_PORT'),
      secure: true,
      auth: {
        user: env('ROBOT_EMAIL'),
        pass: env('ROBOT_PASSWORD'),
      },
    },
    settings: {
      defaultFrom: env('ROBOT_EMAIL'),
      defaultReplyTo: 'nshuttleworth@tasmat.org.uk',
    },
  },
});