export function getWelcomeEmailTemplate(firstName: string, platformName: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
    <h2>Welcome to ${platformName}</h2>
    <p>Hi ${firstName},</p>
    <p>Your account has been verified successfully and you are now ready to use the platform.</p>
    <p>We are excited to have you onboard.</p>
  </div>`;
}
