
import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Gmail SMTP тохиргоо
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Таны Gmail хаяг
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    // Эсвэл бусад SMTP сервер ашиглах бол:
    /*
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    */
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const mailOptions = {
      from: `"MTTA" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || this.stripHtml(options.html),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('И-мэйл илгээхэд алдаа гарлаа');
    }
  }

  async sendPasswordResetEmail(email: string, token: string, baseUrl: string): Promise<void> {
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #10b981; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MTTA - Нууц үг сэргээх</h1>
            </div>
            <div class="content">
              <h2>Сайн байна уу!</h2>
              <p>Та MTTA вэбсайт дээр нууц үг сэргээх хүсэлт илгээсэн байна.</p>
              <p>Нууц үгээ шинэчлэхийн тулд доорх товчийг дарна уу:</p>
              <a href="${resetUrl}" class="button">Нууц үг шинэчлэх</a>
              <p>Эсвэл энэ холбоосыг хөтөч дээрээ хуулж нээнэ үү:</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              <p><strong>Анхаар:</strong> Энэ холбоос 1 цагийн дараа хүчингүй болно.</p>
              <p>Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ и-мэйлыг үл тоомсорлож болно.</p>
            </div>
            <div class="footer">
              <p>© 2025 Mongolian Table Tennis Association</p>
              <p>Энэ и-мэйл автоматаар илгээгдсэн тул хариу бичих шаардлагагүй.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      MTTA - Нууц үг сэргээх
      
      Сайн байна уу!
      
      Та MTTA вэбсайт дээр нууц үг сэргээх хүсэлт илгээсэн байна.
      
      Нууц үгээ шинэчлэхийн тулд энэ холбоосоор орно уу: ${resetUrl}
      
      Анхаар: Энэ холбоос 1 цагийн дараа хүчингүй болно.
      
      Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ и-мэйлыг үл тоомсорлож болно.
    `;

    await this.sendEmail({
      to: email,
      subject: 'MTTA - Нууц үг сэргээх код',
      html,
      text,
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}

export const emailService = new EmailService();
