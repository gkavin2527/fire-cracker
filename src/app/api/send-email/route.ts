
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import type { NextRequest } from 'next/server';

// Define expected shape of the request body
interface EmailRequestBody {
  to: string;
  subject: string;
  htmlBody: string;
}

export async function POST(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM_EMAIL) {
    console.error('SMTP environment variables are not set.');
    return NextResponse.json({ error: 'Email server not configured. Please contact support.' }, { status: 500 });
  }

  try {
    const body = await request.json() as EmailRequestBody;
    const { to, subject, htmlBody } = body;

    if (!to || !subject || !htmlBody) {
      return NextResponse.json({ error: 'Missing required email fields: to, subject, or htmlBody' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: SMTP_FROM_EMAIL, // Sender address from environment variable
      to: to,
      subject: subject,
      html: htmlBody,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error sending email:', error);
    let errorMessage = 'Failed to send email.';
    if (error.code === 'EENVELOPE' && error.responseCode === 550) {
        errorMessage = `Recipient address <${error.recipient}> rejected. Check if it's valid.`;
    } else if (error.code === 'EAUTH') {
        errorMessage = 'SMTP authentication error. Check your SMTP_USER and SMTP_PASS credentials.';
    } else if (error.code === 'ECONNREFUSED') {
        errorMessage = `Connection refused by SMTP server ${SMTP_HOST}:${SMTP_PORT}. Check host and port.`;
    }
    return NextResponse.json({ error: errorMessage, details: error.message || String(error) }, { status: 500 });
  }
}
