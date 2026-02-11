import dotenv from "dotenv";
import dns from 'node:dns';

dotenv.config();

try {
  if ('setDefaultResultOrder' in dns) {
    (dns as any).setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  console.log('Could not set default result order', e);
}

import nodemailer from "nodemailer";
import SMTPTransport from 'nodemailer/lib/smtp-transport';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4,
  logger: true,
  debug: true,
} as SMTPTransport.Options);

export const sendVerificationEmail = async (email: string, token: string) => {
  const link = `${process.env.BASE_URL}/verify-account?token=${token}`;

  try {
    await transporter.sendMail({
      from: '"TrentoArena Team" <noreply@trentoarena.com>',
      to: email,
      subject: "Verifica il tuo account TrentoArena",
      html: `
                <div style="font-family: Arial; padding: 40px; text-align: center; background-color: #f9f9f9;">
                    <div style="background-color: white; padding: 20px; border-radius: 10px; display: inline-block; border: 1px solid #ddd;">
                        <h2 style="color: #fd7e14; margin-top: 0;">Benvenuto in TrentoArena!</h2>
                        <p style="color: #333;">Grazie per esserti registrato. Clicca il pulsante qui sotto per attivare il tuo profilo:</p>
                        <div style="margin: 30px 0;">
                            <a href="${link}" style="background-color: #fd7e14; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Verifica il mio account</a>
                        </div>
                    </div>
                </div>
            `,
    });
    console.log(`📧 Mail inviata a ${email}`);
  } catch (error) {
    console.error("❌ Errore invio mail:", error);
    throw error;
  }
};
