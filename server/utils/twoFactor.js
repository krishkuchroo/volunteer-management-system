const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

async function generate2FASecret(email) {
  const secret = speakeasy.generateSecret({
    name: `VolunteerMS (${email})`,
    length: 20,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrCode: qrCodeDataUrl,
  };
}

function verify2FAToken(secret, token) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: String(token),
    window: 2,
  });
}

module.exports = { generate2FASecret, verify2FAToken };
