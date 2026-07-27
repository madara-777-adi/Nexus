import env from "../../../config/env";
import resend from "../../../config/resend";
import verificationEmailTemplate from "../../../shared/templates/verificationEmail";
import passwordResetEmailTemplate from "../../../shared/templates/passwordResetEmail";

class EmailService {
  async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    // Ensure the backend builds the link with ?token=
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = verificationEmailTemplate(firstName, verificationUrl);
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: "Verify your NexusSpace account",
      html,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const resetPasswordUrl = `${env.FRONTEND_URL}/reset-password/${token}`;
    const html = passwordResetEmailTemplate(firstName, resetPasswordUrl);
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: "Reset your NexusSpace password",
      html,
    });
  }
}
export default new EmailService();
