import twilio from 'twilio';
import crypto from 'crypto';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

let client: any = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

const OTP_TTL_SECONDS = parseInt(process.env.OTP_TTL_SECONDS || '300');

export function generateOTP(): string {
  // Generate 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function sendOTP(to: string, otp: string, name: string): Promise<void> {
  const message = `Сайн байна уу ${name}! Таны баталгаажуулах код: ${otp}. Энэ код ${Math.floor(OTP_TTL_SECONDS / 60)} минутын дотор хүчинтэй. - МХХХ`;

  if (client && fromNumber) {
    try {
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: to,
      });
      console.log(`✅ OTP sent to ${to}`);
    } catch (error) {
      console.error(`❌ Failed to send OTP to ${to}:`, error);
      throw new Error('SMS илгээх явцад алдаа гарлаа');
    }
  } else {
    console.log(`⚠️ Twilio not configured. Would send SMS to ${to}:`);
    console.log(`   Message: ${message}`);
  }
}

export async function sendSuccessSMS(to: string, name: string): Promise<void> {
  const message = `Баяр хүргэе ${name}! Таны бүртгэл амжилттай баталгаажлаа. Та одоо системд нэвтрэх боломжтой. - МХХХ`;

  if (client && fromNumber) {
    try {
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: to,
      });
      console.log(`✅ Success SMS sent to ${to}`);
    } catch (error) {
      console.error(`❌ Failed to send success SMS to ${to}:`, error);
    }
  } else {
    console.log(`⚠️ Twilio not configured. Would send success SMS to ${to}`);
  }
}
