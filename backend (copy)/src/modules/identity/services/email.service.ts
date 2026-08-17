import logger from "../../../shared/logger/logger";
import env from "../../../config/env";
import resend from "../../../config/resend";
import verificationEmailTemplate from "../../../shared/templates/verificationEmail";
import passwordResetEmailTemplate from "../../../shared/templates/passwordResetEmail";
import welcomeEmailTemplate from "../../../shared/templates/welcomeEmail";

class EmailService {
  async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
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

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;
    const html = welcomeEmailTemplate(firstName, dashboardUrl);

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: email,
        subject: "Welcome aboard to NexusSpace! 🚀",
        html,
      });
    } catch (error) {
      // Non-blocking catch so email provider hiccups don't break authentication
      logger.error(
        { service: "EmailService", err: error },
        "Failed to send welcome email",
      );
    }
  }
}

export default new EmailService();
