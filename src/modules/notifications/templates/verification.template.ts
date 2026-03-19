export function getVerificationEmailTemplate(otp: string, platformName: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
    <h2>${platformName} Verification</h2>
    <p>Your OTP for verification is:</p>
    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px; background: #f3f4f6; border-radius: 12px; width: fit-content;">
      ${otp}
    </div>
    <p>This OTP will expire in 10 minutes.</p>
  </div>`;
}
