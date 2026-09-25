const nodemailer = require('nodemailer');

let _transporter = null;
let _transporterReady = false;
let _previewMode = false;

/**
 * Initialize the email transporter.
 * - If EMAIL_USER + EMAIL_PASS are set → use real Gmail/SMTP.
 * - Otherwise → auto-create an Ethereal test account so emails
 *   are actually sent and viewable at a preview URL.
 */
const initTransporter = async () => {
  if (_transporter && _transporterReady) return _transporter;

  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // Option 1: Real SMTP (Gmail or custom host)
  if (user && pass) {
    const config = host
      ? { host, port: Number(port), secure: Number(port) === 465, auth: { user, pass } }
      : { service: 'gmail', auth: { user, pass } };

    _transporter = nodemailer.createTransport(config);
    _previewMode = false;
    _transporterReady = true;
    console.log(`[Email] ✓ Real SMTP transporter ready (${host || 'gmail'})`);
    return _transporter;
  }

  // Option 2: Ethereal test account (auto-created, emails viewable at URL)
  try {
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    _previewMode = true;
    _transporterReady = true;
    console.log('[Email] ✓ Ethereal test account created automatically');
    console.log(`[Email]   User: ${testAccount.user}`);
    console.log('[Email]   Emails will be viewable at preview URLs logged after each send');
    console.log('[Email]   To send REAL emails, add EMAIL_USER + EMAIL_PASS to .env');
    return _transporter;
  } catch (err) {
    console.warn('[Email] ⚠ Could not create Ethereal account:', err.message);
    // Final fallback: console logger
    _transporter = {
      sendMail: async (mailOptions) => {
        console.log('\n================== EMAIL SERVICE (CONSOLE FALLBACK) ==================');
        console.log(`To:      ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        if (mailOptions.attachments && mailOptions.attachments.length > 0) {
          console.log(`Attachment: ${mailOptions.attachments[0].filename} (${mailOptions.attachments[0].content.length} bytes)`);
        }
        console.log('--------------------------------------------------------------');
        console.log(mailOptions.text || '[HTML Content Sent]');
        console.log('====================================================================\n');
        return { messageId: `console-${Date.now()}` };
      }
    };
    _previewMode = false;
    _transporterReady = true;
    return _transporter;
  }
};

/**
 * Send an email and log the Ethereal preview URL if in test mode.
 */
const sendEmail = async (mailOptions) => {
  const transporter = await initTransporter();
  const info = await transporter.sendMail(mailOptions);

  // Log Ethereal preview URL so the user can click to view the email
  if (_previewMode && info.messageId) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email] ✉ Preview URL: ${previewUrl}`);
    }
  }

  return info;
};

/**
 * Sends a Password Reset Email with action link
 */
const sendPasswordResetEmail = async (toEmail, resetUrl, userName = 'Student') => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"College Event Portal" <no-reply@college-events.edu>',
    to: toEmail,
    subject: 'Password Reset Request - College Event Registration Portal',
    text: `Hello ${userName},\n\nYou requested a password reset for your College Event Portal account.\nPlease click the following link to reset your password:\n${resetUrl}\n\nThis link is valid for 1 hour.\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1e40af; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">College Event Registration Portal</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Account Security Assistance</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff; color: #0f172a; line-height: 1.6;">
          <h2 style="font-size: 18px; margin-top: 0;">Password Reset Request</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>We received a request to reset the password for your account associated with <code>${toEmail}</code>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #1e40af; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b;">Or copy and paste this link into your browser:</p>
          <p style="font-size: 11px; word-break: break-all; color: #1e40af;"><a href="${resetUrl}">${resetUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
            * This password reset link will expire in 1 hour.<br/>
            * If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    `
  };

  const info = await sendEmail(mailOptions);
  // Return preview URL so the API can pass it to the frontend
  const previewUrl = _previewMode ? nodemailer.getTestMessageUrl(info) : null;
  return { info, previewUrl };
};

/**
 * Sends Event Registration Confirmation Email with attached PDF Pass
 */
const sendEventRegistrationEmail = async (toEmail, studentName, event, registration, pdfBuffer) => {
  const cleanTitle = (event.eventTitle || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_');
  const eventDateStr = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'TBA';

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"College Event Portal" <no-reply@college-events.edu>',
    to: toEmail,
    subject: `Registration Confirmed: ${event.eventTitle}`,
    text: `Hello ${studentName},\n\nYour registration for "${event.eventTitle}" is confirmed!\n\nDate: ${eventDateStr}\nVenue: ${event.venue}\nOrganizer: ${event.organizer}\n\nYour official Event Pass has been attached to this email as a PDF.\nSee you at the event!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1e40af; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">College Event Registration Portal</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Official Registration Confirmation</p>
        </div>
        <div style="padding: 28px; background-color: #ffffff; color: #0f172a; line-height: 1.6;">
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; color: #15803d; font-weight: bold;">
              Registration Confirmed! Seat Secured.
            </p>
          </div>
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>You have successfully registered for the following college event:</p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px; color: #1e40af;">${event.eventTitle}</h3>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Category:</strong> ${event.category || 'General'}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Date:</strong> ${eventDateStr}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Venue:</strong> ${event.venue}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Organizer:</strong> ${event.organizer}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Ticket ID:</strong> <code>${registration.registrationId || registration._id}</code></p>
          </div>

          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #1e40af;">
              <strong>PDF Event Pass Attached:</strong> Your official registration confirmation ticket is attached to this email as a PDF document. Please keep it accessible on your phone or print it for entry.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
            College Event Registration Portal * Verified Notification
          </p>
        </div>
      </div>
    `,
    attachments: pdfBuffer
      ? [
          {
            filename: `${cleanTitle}_Registration_Pass.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      : []
  };

  const info = await sendEmail(mailOptions);
  const previewUrl = _previewMode ? nodemailer.getTestMessageUrl(info) : null;
  return { info, previewUrl };
};

module.exports = {
  initTransporter,
  sendPasswordResetEmail,
  sendEventRegistrationEmail
};
