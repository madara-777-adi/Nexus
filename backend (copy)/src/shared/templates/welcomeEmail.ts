import { escapeHtml } from "../utils/escapeHtml";

const welcomeEmailTemplate = (firstName: string, dashboardUrl: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to NexusSpace</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #080A0F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px; background-color: #080A0F;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0d1117; border: 1px solid #1f293d; border-radius: 16px; padding: 32px; text-align: left;">
                <!-- Header -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <span style="color: #BCFF3C; font-size: 20px; font-weight: bold; tracking-wide: 0.1em; text-transform: uppercase;">NexusSpace</span>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Welcome aboard, ${escapeHtml(firstName)}!  </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px; color: #9ca3af; font-size: 15px; line-height: 1.6;">
                    Your account is fully verified and active. You're all set to explore everything NexusSpace has to offer.
                  </td>
                </tr>
                <!-- CTA Button -->
                <tr>
                  <td style="padding-bottom: 32px;">
                    <a href="${dashboardUrl}" target="_blank" style="background-color: #BCFF3C; color: #080A0F; font-weight: bold; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 10px; display: inline-block; text-transform: uppercase; letter-spacing: 0.05em;">
                      Launch Dashboard
                    </a>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="border-t: 1px solid #1f293d; padding-top: 24px; color: #6b7280; font-size: 12px; line-height: 1.5;">
                    If you didn't create an account on NexusSpace, you can safely ignore this email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export default welcomeEmailTemplate;
