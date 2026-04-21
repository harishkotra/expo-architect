import { Resend } from 'resend';

import type { GeneratedAppJson } from '@/types/app-config';
import { prettyConfig } from '@/utils/validate-config';

type SendBody = {
  to?: string;
  config?: GeneratedAppJson;
};

function renderEmail(config: GeneratedAppJson) {
  const pretty = prettyConfig(config).replace(/[&<>]/g, (char) => {
    if (char === '&') {
      return '&amp;';
    }
    if (char === '<') {
      return '&lt;';
    }
    return '&gt;';
  });

  return `
  <div style="font-family: Inter, Segoe UI, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; color: #0f172a;">
    <h1 style="margin: 0 0 6px;">Expo Architect: Your app.json is ready</h1>
    <p style="margin: 0 0 16px; color: #475569;">Generated from your voice/text prompt using Expo docs grounding.</p>
    <pre style="background:#0f172a;color:#e2e8f0;padding:16px;border-radius:12px;overflow:auto;font-size:12px;line-height:1.55;">${pretty}</pre>
    <p style="margin-top: 16px;">
      <a href="https://docs.expo.dev/" style="color:#0ea5e9;text-decoration:none;">Next Steps in Expo Docs</a>
    </p>
  </div>`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Missing RESEND_API_KEY.' }, { status: 500 });
    }

    const body = (await request.json()) as SendBody;
    const to = body.to?.trim();
    const config = body.config;

    if (!to || !to.includes('@')) {
      return Response.json({ error: 'A valid recipient email is required.' }, { status: 400 });
    }

    if (!config?.expo?.name) {
      return Response.json({ error: 'Missing generated config payload.' }, { status: 400 });
    }

    const resend = new Resend(apiKey);

    const from = process.env.RESEND_FROM_EMAIL ?? 'Expo Architect <onboarding@resend.dev>';
    const subject = `Expo Architect config for ${config.expo.name}`;

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html: renderEmail(config),
    });

    if (result.error) {
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    return Response.json({ ok: true, id: result.data?.id ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email.';
    return Response.json({ error: message }, { status: 500 });
  }
}
