const {EmailClient} = require('@azure/communication-email');
require('dotenv').config();

// This code demonstrates how to fetch your connection string
// from an environment variable.
const connectionString =
  process.env['COMMUNICATION_SERVICES_CONNECTION_STRING'];
const protocolFQDNPort = process.env['PROTOCOL_FQDN_PORT'];
async function emailVerification(emailAddress, accountId, verificationToken) {
  try {
    const client = new EmailClient(connectionString);
    const emailMessage = {
      sender: '<donotreply@rc.simas.io>',
      content: {
        subject: 'Rankchoice Voting - Verify Email',
        html: `<style>
        a {
          border: 2px;
          border-color: black;
          border-style: solid;
          border-radius: 5px;
          padding: 5px 10px;
        }
      </style>
      <h1>Verify email</h1>
      <div>${emailAddress}</div>
      <a href="${protocolFQDNPort}/user/${accountId}/verify/\
${verificationToken}">
        Verify email
      </a>`,
      },
      recipients: {
        to: [
          {
            email: `<${emailAddress}>`,
          },
        ],
      },
    };
    await client.send(emailMessage);
  } catch (e) {
    console.log(e);
  }
}

module.exports = {emailVerification};
