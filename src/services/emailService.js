const DEFAULT_FROM = "URBNLY <no-reply@urbnly.com>";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

async function sendEmail({ to, subject, html, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;

  if (!to || !subject) {
    return { skipped: true, reason: "missing_recipient_or_subject" };
  }

  if (!apiKey) {
    console.info(
      JSON.stringify({
        level: "info",
        type: "email_skipped",
        reason: "RESEND_API_KEY not configured",
        to,
        subject,
      })
    );
    return { skipped: true, reason: "missing_resend_api_key" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      reply_to: replyTo || process.env.EMAIL_REPLY_TO || undefined,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email provider failed with ${response.status}: ${body}`);
  }

  return response.json();
}

function buildEmailLayout({ title, eyebrow, preview, body }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#eef8f3;font-family:Inter,Arial,sans-serif;color:#172033;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef8f3;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #d9ebe3;">
            <tr>
              <td style="padding:28px 28px 18px;background:#0f5f4f;">
                <div style="font-size:22px;line-height:1;font-weight:800;letter-spacing:8px;color:#ffffff;">URBNLY</div>
                <div style="margin-top:8px;font-size:13px;color:#c9f5df;">Premium city stays</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <div style="font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#10b981;">${escapeHtml(eyebrow)}</div>
                <h1 style="margin:12px 0 10px;font-size:28px;line-height:1.2;color:#0f5f4f;">${escapeHtml(title)}</h1>
                ${body}
              </td>
            </tr>
          </table>
          <div style="max-width:640px;padding:16px 8px;color:#6b7280;font-size:12px;line-height:1.6;">
            You are receiving this because you use URBNLY. Please do not share sensitive personal documents over email.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

module.exports = {
  escapeHtml,
  sendEmail,
  buildEmailLayout,
};
