const { buildEmailLayout, escapeHtml, sendEmail } = require("./emailService");

const appBaseUrl = () => process.env.APP_BASE_URL || "http://localhost:5173";

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));

const mapLinkFor = (property) => {
  const query = [property.title, property.landmark, property.location]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

async function sendVisitConfirmedEmail({ visit, user, property }) {
  const mapUrl = mapLinkFor(property);
  const ownerPhone = property.ownerPhone || "Contact through URBNLY";
  const landmark = property.landmark || property.location || "Shared by the property owner";

  const html = buildEmailLayout({
    eyebrow: "Visit confirmed",
    title: `Your visit to ${property.title} is confirmed`,
    preview: `Your URBNLY visit is confirmed for ${formatDateTime(visit.scheduledFor)}.`,
    body: `
      <p style="margin:0;color:#5f6b7a;font-size:15px;line-height:1.7;">Hi ${escapeHtml(
        user.name.split(" ")[0] || user.name
      )}, your property owner has confirmed your visit slot. Here are the details to help you reach smoothly.</p>

      <div style="margin:22px 0;padding:18px;border-radius:18px;background:#effaf4;border:1px solid #c9f5df;">
        <div style="font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#0f5f4f;">Visit slot</div>
        <div style="margin-top:8px;font-size:20px;font-weight:800;color:#172033;">${escapeHtml(
          formatDateTime(visit.scheduledFor)
        )}</div>
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;line-height:1.6;color:#172033;">
        <tr><td style="padding:10px 0;border-bottom:1px solid #eef2f1;"><strong>Property</strong></td><td style="padding:10px 0;border-bottom:1px solid #eef2f1;">${escapeHtml(
          property.title
        )}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #eef2f1;"><strong>Area</strong></td><td style="padding:10px 0;border-bottom:1px solid #eef2f1;">${escapeHtml(
          property.location
        )}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #eef2f1;"><strong>Landmark</strong></td><td style="padding:10px 0;border-bottom:1px solid #eef2f1;">${escapeHtml(
          landmark
        )}</td></tr>
        <tr><td style="padding:10px 0;"><strong>POC contact</strong></td><td style="padding:10px 0;">${escapeHtml(
          ownerPhone
        )}</td></tr>
      </table>

      <a href="${mapUrl}" style="display:inline-block;margin-top:22px;background:#0f5f4f;color:#ffffff;text-decoration:none;border-radius:14px;padding:13px 18px;font-weight:800;">Open map location</a>

      <p style="margin:22px 0 0;color:#5f6b7a;font-size:13px;line-height:1.7;">Tip: carry a valid ID and message the POC if you are running late.</p>
    `,
  });

  return sendEmail({
    to: user.email,
    subject: `Visit confirmed: ${property.title}`,
    html,
    text: `Your visit to ${property.title} is confirmed for ${formatDateTime(
      visit.scheduledFor
    )}. Area: ${property.location}. Landmark: ${landmark}. POC: ${ownerPhone}. Map: ${mapUrl}`,
  });
}

async function sendRoommateInterestEmail({ interest, requester, recipient, property }) {
  const workspaceUrl = `${appBaseUrl()}/interested`;
  const html = buildEmailLayout({
    eyebrow: "Roommate request",
    title: `${requester.name.split(" ")[0]} is interested in being your roommate`,
    preview: `${requester.name} from ${requester.company || "URBNLY"} sent you a roommate interest.`,
    body: `
      <p style="margin:0;color:#5f6b7a;font-size:15px;line-height:1.7;">Hi ${escapeHtml(
        recipient.name.split(" ")[0] || recipient.name
      )}, someone matched with your preferences and wants to connect for a possible roommate fit.</p>

      <div style="margin:22px 0;padding:18px;border-radius:18px;background:#effaf4;border:1px solid #c9f5df;">
        <div style="font-size:18px;font-weight:800;color:#172033;">${escapeHtml(
          requester.name
        )}</div>
        <div style="margin-top:4px;color:#5f6b7a;font-size:14px;">${escapeHtml(
          requester.company || "URBNLY member"
        )}</div>
        <div style="margin-top:12px;color:#0f5f4f;font-size:14px;font-weight:700;">Interested at ${escapeHtml(
          property.title
        )}</div>
      </div>

      ${
        interest.message
          ? `<p style="margin:0 0 18px;color:#172033;font-size:14px;line-height:1.7;"><strong>Message:</strong> ${escapeHtml(
              interest.message
            )}</p>`
          : ""
      }

      <a href="${workspaceUrl}" style="display:inline-block;background:#0f5f4f;color:#ffffff;text-decoration:none;border-radius:14px;padding:13px 18px;font-weight:800;">Review request</a>
      <p style="margin:22px 0 0;color:#5f6b7a;font-size:13px;line-height:1.7;">You can accept or decline this request from your URBNLY interested workspace.</p>
    `,
  });

  return sendEmail({
    to: recipient.email,
    subject: `${requester.name.split(" ")[0]} sent you a roommate interest on URBNLY`,
    html,
    text: `${requester.name} from ${
      requester.company || "URBNLY"
    } is interested in being your roommate at ${property.title}. Review it here: ${workspaceUrl}`,
  });
}

module.exports = {
  sendVisitConfirmedEmail,
  sendRoommateInterestEmail,
};
