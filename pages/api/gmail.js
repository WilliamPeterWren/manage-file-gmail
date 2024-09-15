import { google } from 'googleapis';

export default async function handler(req, res) {
  const { accessToken } = req.query;

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth });

  try {
    // Get the list of messages
    const messagesRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'has:attachment',
      maxResults: 10,
    });

    const messages = messagesRes.data.messages || [];



    // For each message, retrieve the attachment
    const attachments = await Promise.all(
      messages.map(async (message) => {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });

        const attachmentPart = msg.data.payload.parts.find(
          (part) => part.filename && part.body.attachmentId
        );

        // console.log(attachmentPart)

        if (attachmentPart) {
          const attachment = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: message.id,
            id: attachmentPart.body.attachmentId,
          });

          return {
            filename: attachmentPart.filename,
            data: attachment.data,  // Base64 encoded data
          };
        }

        return null;
      })
    );

    res.status(200).json({ attachments: attachments.filter(Boolean) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
