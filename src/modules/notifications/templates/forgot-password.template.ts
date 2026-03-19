export function getForgotPasswordEmailTemplate(resetLink: string, platformName: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
    <h2>${platformName} Password Reset</h2>
    <p>We received a request to reset your password.</p>
    <p>
      <a href="${resetLink}" style="display: inline-block; padding: 12px 18px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">
        Reset Password
      </a>
    </p>
    <p>If you did not request this, you can ignore this email.</p>
  </div>`;
}
