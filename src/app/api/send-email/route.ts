
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
    console.log('[EMAIL API] Method Not Allowed:', request.method);
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL } = process.env;

  const requiredEnvVars = { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL };
  const missingEnvVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingEnvVars.length > 0) {
    console.error(`[EMAIL API] ERROR: Missing SMTP environment variables: ${missingEnvVars.join(', ')}. Email server not configured.`);
    console.error('[EMAIL API] Please ensure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM_EMAIL are set in your .env.local file and the server is restarted.');
    return NextResponse.json({ error: 'Email server not configured. Critical environment variables missing. Please contact support or check server logs.' }, { status: 500 });
  }
  
  console.log('[EMAIL API] SMTP Configuration Loaded (variables are present). Host:', SMTP_HOST);

  try {
    const body = await request.json() as EmailRequestBody;
    const { to, subject, htmlBody } = body;

    if (!to || !subject || !htmlBody) {
      console.error('[EMAIL API] ERROR: Missing required email fields in request body:', {to, subject, htmlBody: !!htmlBody});
      return NextResponse.json({ error: 'Missing required email fields: to, subject, or htmlBody' }, { status: 400 });
    }

    console.log(`[EMAIL API] Attempting to send email to: ${to} with subject: "${subject}"`);

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT!, 10),
      secure: parseInt(SMTP_PORT!, 10) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      // requireTLS: true, // Often needed for port 587, may need adjustment based on provider
      // logger: true, // Enable detailed SMTP logging from Nodemailer (very verbose)
      // debug: true, // Enable detailed SMTP logging from Nodemailer (very verbose)
    });

    // Verify connection configuration (optional, but good for debugging)
    // await transporter.verify(); 
    // console.log("[EMAIL API] SMTP Connection Verified Successfully.");


    const mailOptions = {
      from: SMTP_FROM_EMAIL,
      to: to,
      subject: subject,
      html: htmlBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL API] Email sent successfully! Message ID:', info.messageId);
    console.log('[EMAIL API] Full Nodemailer response:', info);
    return NextResponse.json({ message: 'Email sent successfully', messageId: info.messageId }, { status: 200 });

  } catch (error: any) {
    console.error('[EMAIL API] ERROR sending email:', error);
    let errorMessage = 'Failed to send email. Please try again later or contact support.';
    let statusCode = 500;

    if (error.code) {
      switch (error.code) {
        case 'EENVELOPE': // Often for invalid recipient or sender
          errorMessage = `Recipient or sender address issue. Nodemailer code: EENVELOPE. Server response: ${error.response || 'N/A'}`;
          if (error.responseCode === 550) errorMessage = `Recipient address <${(error as any).recipient || to}> rejected. Check if it's valid.`;
          statusCode = 400; 
          break;
        case 'EAUTH':
          errorMessage = 'SMTP authentication error. Check your SMTP_USER and SMTP_PASS credentials in .env.local and ensure they are correct for the SMTP_HOST.';
          statusCode = 401;
          break;
        case 'ECONNREFUSED':
          errorMessage = `Connection refused by SMTP server ${SMTP_HOST}:${SMTP_PORT}. Check host, port, and firewall settings. Ensure the SMTP server is running and accessible.`;
          break;
        case 'ETIMEDOUT':
           errorMessage = `Connection to SMTP server ${SMTP_HOST}:${SMTP_PORT} timed out. Check network connectivity and server responsiveness.`;
           break;
        default:
          errorMessage = `Nodemailer error: ${error.code} - ${error.message || 'Unknown Nodemailer error'}`;
      }
    } else if (error.message) {
        errorMessage = error.message;
    }

    console.error(`[EMAIL API] Detailed error message for client: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage, details: error.message || String(error), code: error.code || 'UNKNOWN' }, { status: statusCode });
  }
}
