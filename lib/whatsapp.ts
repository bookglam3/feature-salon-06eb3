import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

interface WhatsAppConfirmationParams {
  to: string;
  clientName: string;
  serviceName: string;
  staffName?: string;
  salonName: string;
  salonAddress?: string;
  dateTime: string;
  price?: number;
  cancelLink: string;
}

export async function sendWhatsAppConfirmation(params: WhatsAppConfirmationParams) {
  const { to, clientName, serviceName, salonName, dateTime, price } = params;

  const client = twilio(accountSid, authToken);

  const date = new Date(dateTime).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  const time = new Date(dateTime).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit"
  });

  const message = `💈 *Booking Confirmed!*

Hi ${clientName}! Your appointment at *${salonName}* is confirmed.

📅 *Date:* ${date}
⏰ *Time:* ${time}
✂️ *Service:* ${serviceName}
${price ? `💰 *Price:* £${price}` : ""}

Thank you for booking with us! 🙏`;

  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
  const toWhatsApp = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  console.log(`[WhatsApp] Sending to ${toWhatsApp}`);

  await client.messages.create({
    body: message,
    from,
    to: toWhatsApp,
  });
}
