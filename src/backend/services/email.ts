import dotenv from "dotenv";
dotenv.config();

export const sendVerificationEmail = async (email: string, token: string) => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error("❌ BREVO_API_KEY is missing");
  }

  const url = "https://api.brevo.com/v3/smtp/email";
  const link = `${process.env.BASE_URL}/verify-account?token=${token}`;

  const body = {
    sender: { name: "TrentoArena Team", email: process.env.EMAIL_USER },
    to: [{ email: email }],
    subject: "Verifica il tuo account TrentoArena",
    htmlContent: `
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
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Brevo API Error:", errorData);
      throw new Error(`Email failed: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log(
      `📧 Mail sent successfully to real user: ${email} (MsgID: ${data.messageId})`,
    );
    return data;
  } catch (error) {
    console.error("❌ Network Error:", error);
    throw error;
  }
};
