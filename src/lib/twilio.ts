import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(to: string, body: string): Promise<SMSResult> {
  if (!client || !fromNumber) {
    console.warn('Twilio not configured, skipping SMS');
    return { success: false, error: 'SMS not configured' };
  }

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}

export async function sendGameReminder(
  to: string,
  playerName: string,
  teamName: string,
  gameTitle: string,
  gameDate: string,
  rsvpLink: string
): Promise<SMSResult> {
  const message = `Hey ${playerName}! 🏒\n\n` +
    `${teamName} needs your RSVP for: ${gameTitle}\n` +
    `Date: ${gameDate}\n\n` +
    `Let the team know if you're in:\n${rsvpLink}\n\n` +
    `- Shuck-in`;

  return sendSMS(to, message);
}

export async function sendBulkReminders(
  recipients: Array<{
    phone: string;
    name: string;
  }>,
  teamName: string,
  gameTitle: string,
  gameDate: string,
  rsvpLink: string
): Promise<{ sent: number; failed: number; results: SMSResult[] }> {
  const results: SMSResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendGameReminder(
      recipient.phone,
      recipient.name,
      teamName,
      gameTitle,
      gameDate,
      rsvpLink
    );

    results.push(result);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { sent, failed, results };
}
