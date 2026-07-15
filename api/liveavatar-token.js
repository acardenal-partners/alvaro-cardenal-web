const ALLOWED_ORIGIN = 'https://acardenal-partners.github.io';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const response = await fetch('https://api.liveavatar.com/v1/sessions/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.LIVEAVATAR_API_KEY,
      },
      body: JSON.stringify({
        mode: 'FULL',
        avatar_id: '26393b8e-e944-4367-98ef-e2bc75c4b792',
        is_sandbox: true,
        avatar_persona: {
          voice_id: 'b139a8fe-7240-4454-ac37-8c68aebcee41',
          context_id: '8b8a8782-7edb-4790-8fd3-34eee157753e',
          language: 'es',
        },
        video_settings: {
          quality: 'high',
          encoding: 'H264',
        },
        interactivity_type: 'CONVERSATIONAL',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: errorText });
      return;
    }

    const data = await response.json();
    res.status(200).json({ sessionToken: data.session_token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
