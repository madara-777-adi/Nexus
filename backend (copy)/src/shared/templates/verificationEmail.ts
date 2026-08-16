import { escapeHtml } from "../utils/escapeHtml";

const verificationEmailTemplate = (
  firstName: string,
  verificationUrl: string,
): string => {
  const currentYear = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Verify Your Email - NexusSpace Learning</title>
    </head>
<body style="margin: 0; padding: 0; background-color: #060913; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; -webkit-font-smoothing: antialiased; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #060913; table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #0D1222; border-radius: 12px; border: 1px solid #1E2846; overflow: hidden; box-shadow: 0 12px 35px rgba(0,0,0,0.6);">
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                            <span style="font-size: 26px; font-weight: 800; letter-spacing: 1.5px; color: #FFFFFF; font-family: 'Segoe UI', sans-serif;">
                                NEXUS<span style="color: #38BDF8;">SPACE</span><span style="color: #818CF8; font-size: 16px; font-weight: 400; vertical-align: super;">.tech</span>
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td height="2" style="background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #38BDF8 100%); font-size: 0; line-height: 0;">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 40px 20px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="font-size: 20px; font-weight: 700; color: #FFFFFF; padding-bottom: 15px;">
                                        Hi ${escapeHtml(firstName)},
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-size: 15px; font-weight: 400; color: #94A3B8; line-height: 1.6; padding-bottom: 30px;">
                                        Welcome to <strong style="color: #FFFFFF;">NexusSpace</strong>! Your journey into our next-generation learning platform begins right here. To unlock your courses, track your learning progress, and join the community, please verify your email address below.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 40px 30px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" style="border-radius: 6px; background: #3B82F6; background-color: #3B82F6;">
                                        <a href="${verificationUrl}" target="_blank" style="border: 1px solid #3B82F6; border-radius: 6px; color: #FFFFFF; display: inline-block; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; line-height: 50px; text-align: center; text-decoration: none; width: 250px; -webkit-text-size-adjust: none; mso-hide: all; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                                            Verify &amp; Start Learning
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 0 40px 25px 40px;">
                            <span style="font-size: 13px; color: #64748B;">
                                This verification link will expire in <strong style="color: #94A3B8;">24 hours</strong>.
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #080C16; border-radius: 8px; border: 1px solid #1A243B;">
                                <tr>
                                    <td style="padding: 20px; font-size: 13px; color: #94A3B8; line-height: 1.5;">
                                        <span style="font-size: 12px; font-weight: 700; color: #38BDF8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">
                                            Button not working?
                                        </span>
                                        Copy and paste the link below directly into your browser to activate your learning space:
                                        <div style="margin-top: 10px; word-break: break-all; font-family: monospace; font-size: 12px; color: #60A5FA; background-color: #04060C; padding: 12px; border-radius: 4px; border: 1px solid #1E2846;">
                                            ${verificationUrl}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 30px 40px 40px 40px; background-color: #080C16; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; border-top: 1px solid #1A243B;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="font-size: 12px; color: #64748B; line-height: 1.5; padding-bottom: 15px;">
                                        If you didn't sign up for a learning account on NexusSpace, you can safely ignore and delete this email.
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="font-size: 11px; color: #475569; font-family: monospace;">
                                        ${currentYear} NEXUSSPACE.TECH // EMPOWERING YOUR LEARNING JOURNEY
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

export default verificationEmailTemplate;
