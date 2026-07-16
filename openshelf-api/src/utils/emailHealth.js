const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const FROM_DOMAIN = EMAIL_FROM.split('@')[1];

const getEmailHealth = async () => {
  const start = Date.now();

  if (!RESEND_API_KEY) {
    return { status: 'down', latencyMs: 0, error: 'RESEND_API_KEY is not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return { status: 'degraded', latencyMs, httpStatus: res.status };
    }

    const data = await res.json();
    const domain = data.data?.find((d) => d.name === FROM_DOMAIN);
    const domainVerified = FROM_DOMAIN === 'resend.dev' ? true : domain?.status === 'verified';

    return { status: 'healthy', latencyMs, domainVerified };
  } catch (err) {
    return { status: 'down', latencyMs: Date.now() - start, error: err.message };
  }
};

export { getEmailHealth };
