// Welcome email via Resend REST API (no SDK required).
// Add RESEND_API_KEY to Vercel environment variables.
// The "from" domain (framio.shop) must be verified in your Resend dashboard.

function welcomeHtml(name: string, email: string): string {
  const displayName = name || email.split('@')[0];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Welcome to Framio</title>
</head>
<body style="margin:0;padding:0;background:#F5EDE5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F5EDE5;">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;">

      <!-- Logo -->
      <tr><td align="center" style="padding-bottom:24px;">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="background:#2D1F1A;border-radius:14px;padding:10px 20px;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Framio</span>
            </td>
          </tr>
        </table>
        <p style="margin:8px 0 0;font-size:12px;color:#7A6A64;">Made with Love</p>
      </td></tr>

      <!-- Hero card -->
      <tr><td style="background:#C4634F;border-radius:24px 24px 0 0;padding:40px 40px 32px;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">Welcome to the family</p>
        <h1 style="margin:0 0 12px;font-size:32px;font-weight:800;color:#ffffff;line-height:1.2;">
          Hey ${displayName}! 🎉
        </h1>
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.85);line-height:1.6;">
          Your Framio account is ready. Turn your favourite memories into beautiful, personalised frames — delivered right to your door.
        </p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;border-radius:0 0 24px 24px;padding:36px 40px 40px;">

        <!-- Account details -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="background:#F5EDE5;border-radius:14px;padding:20px 24px;margin-bottom:28px;">
          <tr>
            <td>
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#7A6A64;text-transform:uppercase;letter-spacing:0.8px;">Your account</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#2D1F1A;">${email}</p>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
          <tr><td align="center">
            <a href="https://framio.shop/products"
              style="display:inline-block;background:#C4634F;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:14px;letter-spacing:0.2px;">
              Start Shopping &rarr;
            </a>
          </td></tr>
        </table>

        <!-- Quick links -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
          <tr>
            <td width="33%" align="center" style="padding:0 6px;">
              <a href="https://framio.shop/products"
                style="display:block;background:#F5EDE5;border-radius:12px;padding:16px 8px;text-decoration:none;">
                <p style="margin:0 0 4px;font-size:18px;">🖼️</p>
                <p style="margin:0;font-size:12px;font-weight:700;color:#2D1F1A;">Shop Frames</p>
              </a>
            </td>
            <td width="33%" align="center" style="padding:0 6px;">
              <a href="https://framio.shop/account"
                style="display:block;background:#F5EDE5;border-radius:12px;padding:16px 8px;text-decoration:none;">
                <p style="margin:0 0 4px;font-size:18px;">👤</p>
                <p style="margin:0;font-size:12px;font-weight:700;color:#2D1F1A;">My Account</p>
              </a>
            </td>
            <td width="33%" align="center" style="padding:0 6px;">
              <a href="https://wa.me/917010388736"
                style="display:block;background:#F5EDE5;border-radius:12px;padding:16px 8px;text-decoration:none;">
                <p style="margin:0 0 4px;font-size:18px;">💬</p>
                <p style="margin:0;font-size:12px;font-weight:700;color:#2D1F1A;">Support</p>
              </a>
            </td>
          </tr>
        </table>

        <hr style="border:none;border-top:1px solid #E8DDD6;margin:0 0 24px;" />

        <p style="margin:0;font-size:13px;color:#7A6A64;line-height:1.7;text-align:center;">
          Questions? Chat with us on <a href="https://wa.me/917010388736" style="color:#C4634F;text-decoration:none;font-weight:600;">WhatsApp</a>
          or email <a href="mailto:hello@framio.shop" style="color:#C4634F;text-decoration:none;font-weight:600;">hello@framio.shop</a><br />
          Mon – Sat &middot; 9 AM – 8 PM IST
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="padding:24px 0 8px;">
        <p style="margin:0;font-size:11px;color:#7A6A64;line-height:1.8;">
          &copy; ${new Date().getFullYear()} Framio &middot; Made with Love in India<br />
          You received this because you created a Framio account with ${email}
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function sendWelcomeEmail(email: string | null | undefined, name: string | null | undefined) {
  if (!email) { console.warn('[Framio] sendWelcomeEmail: no email provided'); return; }
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('[Framio] RESEND_API_KEY is not set — welcome email NOT sent to', email);
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Framio <hello@framio.shop>',
        to: email,
        subject: `Welcome to Framio${name ? `, ${name.split(' ')[0]}` : ''}! Your frames await 🎉`,
        html: welcomeHtml(name ?? '', email),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      console.error('[Framio] Resend error:', json);
    } else {
      console.log('[Framio] Welcome email sent:', json.id, '→', email);
    }
  } catch (err) {
    console.error('[Framio] sendWelcomeEmail exception:', err);
  }
}
