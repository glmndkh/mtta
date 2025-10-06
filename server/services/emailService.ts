import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Initialize SendGrid with API key from environment
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

// Fallback to Ethereal for development
let etherealTransporter: any = null;
const initEthereal = async () => {
  if (!etherealTransporter && !apiKey) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      etherealTransporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('📧 Ethereal email initialized for development');
    } catch (error) {
      console.error('Failed to initialize Ethereal:', error);
    }
  }
};

const APP_URL = process.env.APP_URL || 'http://localhost:5000';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@mtta.mn';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mtta.mn';

export async function sendVerificationEmail(
  to: string,
  token: string,
  pendingId: string,
  name: string
): Promise<void> {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}&pending=${pendingId}`;

  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'Бүртгэлээ баталгаажуулна уу - МХХХ',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a7f5f; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 15px 30px; 
            background-color: #1a7f5f; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { color: #d32f2f; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Монголын Ширээний Теннисний Холбоо</h1>
          </div>
          <div class="content">
            <h2>Сайн байна уу, ${name}!</h2>
            <p>Таныг Монголын Ширээний Теннисний Холбооны системд бүртгүүлэх хүсэлт илгээсэн байна.</p>
            <p>Бүртгэлээ баталгаажуулахын тулд доорх товчыг дарна уу:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Имэйл баталгаажуулах</a>
            </div>
            <p>Эсвэл дараах холбоосыг хуулж веб хөтчөөсөө нээнэ үү:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">
              ${verificationUrl}
            </p>
            <p class="warning">⏰ Энэ холбоос 24 цагийн дотор хүчинтэй байна.</p>
            <p><strong>Дараагийн алхамууд:</strong></p>
            <ol>
              <li>Имэйл хаягаа баталгаажуулна</li>
              <li>Утасны дугаараа баталгаажуулах OTP код хүлээн авна</li>
              <li>Админ таны бүртгэлийг хянаж баталгаажуулна</li>
            </ol>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Хэрэв та энэ бүртгэлийг үүсгээгүй бол энэ имэйлийг үл тоомсорлоно уу.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Монголын Ширээний Теннисний Холбоо. Бүх эрх хуулиар хамгаалагдсан.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  if (apiKey) {
    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${to}`);
  } else {
    console.log(`⚠️ SendGrid not configured. Would send email to ${to}:`);
    console.log(`   Subject: ${msg.subject}`);
    console.log(`   Verification URL: ${verificationUrl}`);
  }
}

export async function sendAdminNotification(
  pendingId: string,
  name: string,
  email: string,
  phone: string,
  uploadedFilename: string | null
): Promise<void> {
  const reviewUrl = `${APP_URL}/admin/review?pending=${pendingId}`;

  const msg = {
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject: `Шинэ бүртгэл хүсэлт - ${name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #d32f2f; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table td { padding: 10px; border-bottom: 1px solid #ddd; }
          .info-table td:first-child { font-weight: bold; width: 150px; }
          .button { 
            display: inline-block; 
            padding: 15px 30px; 
            background-color: #d32f2f; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Шинэ бүртгэл хүсэлт</h1>
          </div>
          <div class="content">
            <p>Шинэ хэрэглэгч бүртгүүлэх хүсэлт илгээсэн байна:</p>
            <table class="info-table">
              <tr>
                <td>Нэр:</td>
                <td>${name}</td>
              </tr>
              <tr>
                <td>Имэйл:</td>
                <td>${email}</td>
              </tr>
              <tr>
                <td>Утас:</td>
                <td>${phone}</td>
              </tr>
              <tr>
                <td>Баталгаажуулах файл:</td>
                <td>${uploadedFilename || 'Хавсралт байхгүй'}</td>
              </tr>
              <tr>
                <td>Огноо:</td>
                <td>${new Date().toLocaleString('mn-MN')}</td>
              </tr>
            </table>
            <div style="text-align: center;">
              <a href="${reviewUrl}" class="button">Хүсэлт хянах</a>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              Хүсэлтийг хянаж, баталгаажуулсны дараа хэрэглэгч системд нэвтрэх боломжтой болно.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  if (apiKey) {
    await sgMail.send(msg);
    console.log(`✅ Admin notification sent for pending ID: ${pendingId}`);
  } else {
    console.log(`⚠️ SendGrid not configured. Would send admin notification:`);
    console.log(`   To: ${ADMIN_EMAIL}`);
    console.log(`   Review URL: ${reviewUrl}`);
  }
}

export async function sendSuccessEmail(
  to: string,
  name: string
): Promise<void> {
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'Амжилттай бүртгэгдлээ - МХХХ',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a7f5f; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .success { color: #1a7f5f; font-size: 24px; text-align: center; margin: 20px 0; }
          .button { 
            display: inline-block; 
            padding: 15px 30px; 
            background-color: #1a7f5f; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Монголын Ширээний Теннисний Холбоо</h1>
          </div>
          <div class="content">
            <div class="success">✅ Амжилттай бүртгэгдлээ!</div>
            <p>Сайн байна уу, ${name}!</p>
            <p>Таны бүртгэл амжилттай баталгаажлаа. Та одоо системд нэвтэрч, тэмцээнд оролцох боломжтой боллоо.</p>
            <div style="text-align: center;">
              <a href="${APP_URL}/login" class="button">Нэвтрэх</a>
            </div>
            <p style="margin-top: 30px;">
              <strong>Танд боломжтой үйлдлүүд:</strong>
            </p>
            <ul>
              <li>Профайл засах</li>
              <li>Тэмцээнд бүртгүүлэх</li>
              <li>Өөрийн статистик харах</li>
              <li>Клубт элсэх</li>
            </ul>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Асуулт байвал бидэнтэй холбогдоно уу.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  if (apiKey) {
    await sgMail.send(msg);
    console.log(`✅ Success email sent to ${to}`);
  } else {
    console.log(`⚠️ SendGrid not configured. Would send success email to ${to}`);
  }
}

export async function sendRejectionEmail(
  to: string,
  name: string,
  reason: string
): Promise<void> {
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'Бүртгэлийн мэдэгдэл - МХХХ',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #d32f2f; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .reason { background: #fff; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Монголын Ширээний Теннисний Холбоо</h1>
          </div>
          <div class="content">
            <p>Сайн байна уу, ${name}!</p>
            <p>Таны бүртгэлийн хүсэлтийг хянаж үзсэн. Харамсалтай нь дараах шалтгаанаар таны бүртгэлийг баталгаажуулах боломжгүй боллоо:</p>
            <div class="reason">
              <strong>Шалтгаан:</strong><br>
              ${reason}
            </div>
            <p>Хэрэв та энэ шийдвэртэй санал нийлэхгүй бол бидэнтэй холбогдоно уу.</p>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Админ холбоо барих: ${ADMIN_EMAIL}
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  if (apiKey) {
    await sgMail.send(msg);
    console.log(`✅ Rejection email sent to ${to}`);
  } else {
    console.log(`⚠️ SendGrid not configured. Would send rejection email to ${to}`);
  }
}

// Generate secure random token
export function generateToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

// Hash token for storage
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
