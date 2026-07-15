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
        avatar_id: '200eba85-74c0-4210-8670-81ceab4efd0d',
        is_sandbox: false,
        avatar_persona: {
          voice_id: 'a4d4788b-3a44-4d34-b350-9450050a2fb8',
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
    res.status(200).json({ sessionToken: data.data.session_token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
