import nodemailer from 'nodemailer';
import { config } from '../config.js';

const transport = config.smtp.host
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    })
  : null;

export const mailEnabled = Boolean(transport && config.smtp.to);

/** Fire-and-forget notification; failures are logged, never surfaced to the visitor. */
export async function notifyNewMessage(msg) {
  if (!mailEnabled) return;
  try {
    await transport.sendMail({
      from: config.smtp.from,
      to: config.smtp.to,
      replyTo: `${msg.name} <${msg.email}>`,
      subject: `[Portfolio] ${msg.subject || 'New message'} — ${msg.name}`,
      text: `${msg.body}\n\n— ${msg.name} <${msg.email}>`,
    });
  } catch (err) {
    console.error('Failed to send notification email:', err.message);
  }
}
