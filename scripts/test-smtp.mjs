/**
 * Proves Gmail SMTP works before anything is deployed.
 *
 *   node scripts/test-smtp.mjs someone@example.com
 *
 * Reads SMTP_USER / SMTP_PASS from .env.local. Send it to an address that is
 * NOT the Gmail account itself - delivering to your own inbox proves nothing,
 * since that already worked through Resend. A different address is the whole
 * point of this change.
 */
import { readFileSync } from "node:fs";
import nodemailer from "nodemailer";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const to = process.argv[2];
if (!to?.includes("@")) {
  console.error("usage: node scripts/test-smtp.mjs someone@example.com");
  process.exit(1);
}

const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");

if (!user || !pass) {
  console.error("SMTP_USER / SMTP_PASS are not set in .env.local yet.");
  process.exit(1);
}

console.log(`account   ${user}`);
console.log(`password  ${pass.length} chars (App Passwords are 16)`);
console.log(`sending   -> ${to}\n`);

const tx = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user, pass },
});

try {
  await tx.verify();
  console.log("✓ Gmail accepted the credentials");
} catch (error) {
  console.error(`✗ Gmail rejected the login: ${error.message}`);
  console.error("\n  535 usually means the App Password is wrong, or you pasted");
  console.error("  the normal account password. It must be the 16-character one");
  console.error("  from myaccount.google.com/apppasswords, with 2-Step on.");
  process.exit(1);
}

const info = await tx.sendMail({
  from: process.env.SMTP_FROM?.trim() || `Sutra <${user}>`,
  to,
  subject: "Sutra — email delivery test",
  html: `
    <div style="margin:0;padding:24px;background:#1a1416;font-family:Helvetica,Arial,sans-serif">
      <div style="max-width:520px;margin:0 auto;background:#261d1f;border-radius:16px;overflow:hidden">
        <div style="padding:26px 30px 18px;border-bottom:1px solid rgba(255,255,255,.08)">
          <div style="font-size:23px;font-weight:700;color:#c24a4a;letter-spacing:.5px">sutRa</div>
          <div style="font-size:11px;color:#b8860b;letter-spacing:2px;text-transform:uppercase;margin-top:4px">
            Indian Traditional Wear
          </div>
        </div>
        <div style="padding:26px 30px;color:#f5eee8;font-size:14px;line-height:1.65">
          <p style="margin:0 0 12px;font-size:18px">Delivery is working.</p>
          <p style="margin:0;color:#c8bdb6">
            If you are reading this at an address other than the shop's own Gmail
            account, order confirmations, invoices and password-reset codes will
            now reach real customers.
          </p>
        </div>
      </div>
    </div>`,
});

console.log(`✓ sent — message id ${info.messageId}`);
console.log(`  accepted: ${info.accepted.join(", ") || "(none)"}`);
if (info.rejected?.length) console.log(`  rejected: ${info.rejected.join(", ")}`);
