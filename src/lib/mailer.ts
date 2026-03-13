import nodemailer from "nodemailer";

// ─── SMTP Transport ───────────────────────────────────────────────────────────
// GoDaddy uses their own SMTP relay. Configure via environment variables.
// Required .env vars:
//   EMAIL_HOST       e.g. smtpout.secureserver.net
//   EMAIL_PORT       e.g. 465 (SSL) or 587 (TLS)
//   EMAIL_SECURE     "true" for port 465, "false" for 587
//   EMAIL_USER       your full GoDaddy email address
//   EMAIL_PASS       your GoDaddy email password
//   EMAIL_FROM_NAME  display name, e.g. "PantryMonium"

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST   ?? "smtpout.secureserver.net",
  port:   Number(process.env.EMAIL_PORT ?? 465),
  secure: process.env.EMAIL_SECURE !== "false", // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER ?? "",
    pass: process.env.EMAIL_PASS ?? "",
  },
  tls: {
    // GoDaddy certs are valid — keep this false in production
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});

const FROM = `"${process.env.EMAIL_FROM_NAME ?? "PantryMonium"}" <${process.env.EMAIL_USER ?? ""}>`;
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ─── Shared HTML wrapper ──────────────────────────────────────────────────────

function wrapHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #F5F0EB; font-family: Arial, Helvetica, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header  { background: linear-gradient(135deg, #2D3748 0%, #4A6FA5 100%); padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p  { margin: 6px 0 0; color: rgba(255,255,255,0.7); font-size: 13px; }
    .body    { padding: 36px 40px; }
    .body h2 { margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #2D3748; }
    .body p  { margin: 0 0 16px; font-size: 15px; color: #4A5568; line-height: 1.6; }
    .detail-box { background: #F7FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px 24px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
    .detail-label { color: #718096; font-weight: 600; }
    .detail-value { color: #2D3748; font-weight: 500; text-align: right; }
    .btn { display: inline-block; margin: 8px 0; padding: 13px 32px; background: #4A6FA5; color: #ffffff !important; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 10px; }
    .notice { background: #EBF8F0; border: 1px solid #C6E8D5; border-radius: 10px; padding: 14px 18px; margin: 20px 0; font-size: 14px; color: #276749; }
    .warning { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 18px; margin: 20px 0; font-size: 14px; color: #92400e; }
    .footer  { background: #F7FAFC; padding: 20px 40px; text-align: center; border-top: 1px solid #E2E8F0; }
    .footer p { margin: 0; font-size: 12px; color: #A0AEC0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🥫 PantryMonium</h1>
      <p>Your Pantry, Perfectly Remembered</p>
    </div>
    <div class="body">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>You received this email because of activity on your PantryMonium account.<br/>
      If you didn't take this action, please <a href="${APP_URL}/login" style="color:#4A6FA5;">sign in</a> and change your password immediately.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email: Welcome / Account Created ─────────────────────────────────────────

export async function sendWelcomeEmail(to: string, fullName: string) {
  const firstName = fullName.split(" ")[0] || fullName;

  const html = wrapHtml("Welcome to PantryMonium!", `
    <h2>Welcome, ${firstName}! 🎉</h2>
    <p>Your PantryMonium account has been created successfully. You're all set to start managing your pantry smarter.</p>

    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Name</span>
        <span class="detail-value">${fullName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email</span>
        <span class="detail-value">${to}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Account Created</span>
        <span class="detail-value">${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
      </div>
    </div>

    <p>Here's what you can do with PantryMonium:</p>
    <p>
      📦 <strong>Track your pantry</strong> — manage quantities, expiry dates &amp; restock thresholds<br/>
      🛒 <strong>Shopping list</strong> — automatically generated from low-stock items<br/>
      🍽️ <strong>Recipe suggestions</strong> — discover recipes based on what you have<br/>
      🔔 <strong>Alerts</strong> — get notified before food expires
    </p>

    <div class="notice">
      Your account comes with 6 default categories pre-loaded: Produce, Dairy, Pantry Staples, Frozen, Meat, and Bakery. You can customise these any time.
    </div>

    <p style="text-align:center;margin-top:28px;">
      <a href="${APP_URL}/dashboard" class="btn">Go to My Pantry →</a>
    </p>
  `);

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Welcome to PantryMonium! Your account is ready 🥫",
    html,
    text: `Welcome to PantryMonium, ${firstName}!\n\nYour account has been created successfully.\nEmail: ${to}\n\nLog in at: ${APP_URL}/login`,
  });
}

// ─── Email: Account Updated ────────────────────────────────────────────────────

export async function sendAccountUpdatedEmail(
  to: string,
  fullName: string,
  changes: { field: string; newValue: string }[]
) {
  const firstName = fullName.split(" ")[0] || fullName;

  const changeRows = changes
    .map((c) => `
      <div class="detail-row">
        <span class="detail-label">${c.field}</span>
        <span class="detail-value">${c.newValue}</span>
      </div>`)
    .join("");

  const html = wrapHtml("Your account has been updated", `
    <h2>Account Updated</h2>
    <p>Hi ${firstName}, your PantryMonium account details were updated on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}.</p>

    <div class="detail-box">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:0.05em;">Changes Made</p>
      ${changeRows}
    </div>

    <div class="warning">
      If you did not make these changes, please <a href="${APP_URL}/login" style="color:#92400e;font-weight:700;">sign in immediately</a> and update your password to secure your account.
    </div>

    <p style="text-align:center;margin-top:28px;">
      <a href="${APP_URL}/profile" class="btn">Review My Account →</a>
    </p>
  `);

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Your PantryMonium account has been updated",
    html,
    text: `Hi ${firstName},\n\nYour account was updated.\nChanges: ${changes.map((c) => `${c.field}: ${c.newValue}`).join(", ")}\n\nIf this wasn't you, log in and change your password immediately: ${APP_URL}/login`,
  });
}

// ─── Email: Password Changed ───────────────────────────────────────────────────

export async function sendPasswordChangedEmail(to: string, fullName: string) {
  const firstName = fullName.split(" ")[0] || fullName;

  const html = wrapHtml("Your password has been changed", `
    <h2>Password Changed</h2>
    <p>Hi ${firstName}, the password for your PantryMonium account was successfully changed on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}.</p>

    <div class="notice">
      ✅ Your new password is now active. You'll need to use it the next time you sign in on a new device or after your session expires.
    </div>

    <div class="warning">
      <strong>Didn't change your password?</strong> This could mean someone else has access to your account. Please <a href="${APP_URL}/login" style="color:#92400e;font-weight:700;">sign in immediately</a> and change your password again, or contact support.
    </div>

    <p style="text-align:center;margin-top:28px;">
      <a href="${APP_URL}/login" class="btn">Sign In →</a>
    </p>
  `);

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Your PantryMonium password has been changed",
    html,
    text: `Hi ${firstName},\n\nYour PantryMonium password was changed successfully.\n\nIf this wasn't you, sign in immediately and change your password: ${APP_URL}/login`,
  });
}
