import { LiveAvatarSession } from 'https://esm.sh/@heygen/liveavatar-web-sdk';

const TOKEN_ENDPOINT = 'https://alvaro-cardenal-web-kohl.vercel.app/api/liveavatar-token';

const style = document.createElement('style');
style.textContent = `
  #la-widget-btn{position:fixed;bottom:24px;right:24px;z-index:9999;background:#8B5CF6;color:#fff;border:none;
    border-radius:100px;padding:16px 26px;font-family:'Outfit',sans-serif;font-weight:600;font-size:.95rem;
    cursor:pointer;box-shadow:0 8px 30px rgba(139,92,246,.45);transition:transform .25s ease,box-shadow .25s ease}
  #la-widget-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(139,92,246,.6)}
  #la-widget-panel{position:fixed;bottom:24px;right:24px;z-index:9999;width:min(360px,92vw);
    background:#1A1236;border:1px solid rgba(139,92,246,.35);border-radius:18px;overflow:hidden;
    box-shadow:0 24px 70px -18px rgba(0,0,0,.6);display:none;flex-direction:column;font-family:'Inter',sans-serif}
  #la-widget-panel.open{display:flex}
  #la-widget-panel .la-head{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;
    border-bottom:1px solid rgba(139,92,246,.2);color:#F2EFEA;font-weight:600;font-size:.9rem}
  #la-widget-panel .la-head button{background:none;border:none;color:#F2EFEA;font-size:1.1rem;cursor:pointer;opacity:.7;margin-left:10px}
  #la-widget-panel .la-head button:hover{opacity:1}
  #la-widget-video-wrap{position:relative;width:100%;aspect-ratio:9/12;background:#0D0520}
  #la-widget-video-wrap video{width:100%;height:100%;object-fit:cover;display:block}
  #la-widget-status{position:absolute;top:10px;left:12px;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;
    color:rgba(242,239,234,.6);background:rgba(13,5,32,.6);padding:4px 10px;border-radius:100px}
  #la-widget-form{display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(139,92,246,.2)}
  #la-widget-form input{flex:1;background:rgba(237,233,227,.05);border:1px solid rgba(139,92,246,.25);border-radius:10px;
    padding:10px 14px;color:#F2EFEA;font-size:.85rem}
  #la-widget-form input:focus{outline:none;border-color:#8B5CF6}
  #la-widget-form button{background:#8B5CF6;color:#fff;border:none;border-radius:10px;padding:0 16px;cursor:pointer;font-size:.85rem}
`;
document.head.appendChild(style);

const btn = document.createElement('button');
btn.id = 'la-widget-btn';
btn.type = 'button';
btn.textContent = 'Hablar con el asistente';
document.body.appendChild(btn);

const panel = document.createElement('div');
panel.id = 'la-widget-panel';
panel.innerHTML = `
  <div class="la-head">
    <span>Asistente de Álvaro Cardenal</span>
    <div>
      <button type="button" id="la-widget-mic" aria-label="Activar micrófono">🔇</button>
      <button type="button" id="la-widget-close" aria-label="Cerrar">✕</button>
    </div>
  </div>
  <div id="la-widget-video-wrap">
    <span id="la-widget-status">Conectando…</span>
    <video id="la-widget-video" autoplay playsinline></video>
  </div>
  <form id="la-widget-form">
    <input id="la-widget-input" type="text" placeholder="Escribe tu pregunta…" autocomplete="off">
    <button type="submit">Enviar</button>
  </form>
`;
document.body.appendChild(panel);

const videoEl = panel.querySelector('#la-widget-video');
const statusEl = panel.querySelector('#la-widget-status');
const form = panel.querySelector('#la-widget-form');
const input = panel.querySelector('#la-widget-input');
const closeBtn = panel.querySelector('#la-widget-close');
const micBtn = panel.querySelector('#la-widget-mic');

let session = null;
let keepAliveTimer = null;
let starting = false;

async function startSession() {
  if (session || starting) return;
  starting = true;
  statusEl.textContent = 'Conectando…';
  statusEl.style.display = 'block';
  try {
    const tokenRes = await fetch(TOKEN_ENDPOINT, { method: 'POST' });
    if (!tokenRes.ok) throw new Error('No se pudo obtener el token de sesión');
    const { sessionToken } = await tokenRes.json();

    session = new LiveAvatarSession(sessionToken, { voiceChat: { defaultMuted: true } });

    session.on('session.stream_ready', () => {
      statusEl.style.display = 'none';
      session.attach(videoEl);
    });

    session.voiceChat.on('MUTED', () => { micBtn.textContent = '🔇'; });
    session.voiceChat.on('UNMUTED', () => { micBtn.textContent = '🎤'; });

    await session.start();

    keepAliveTimer = setInterval(() => {
      session?.keepAlive?.();
    }, 30000);
  } catch (err) {
    statusEl.textContent = 'Error de conexión';
    console.error('[avatar-widget]', err);
  } finally {
    starting = false;
  }
}

function stopSession() {
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  keepAliveTimer = null;
  session?.stop?.();
  session = null;
  micBtn.textContent = '🔇';
}

micBtn.addEventListener('click', () => {
  if (!session) return;
  if (session.voiceChat.isMuted) {
    session.voiceChat.unmute();
  } else {
    session.voiceChat.mute();
  }
});

btn.addEventListener('click', () => {
  panel.classList.add('open');
  btn.style.display = 'none';
  startSession();
});

closeBtn.addEventListener('click', () => {
  panel.classList.remove('open');
  btn.style.display = 'block';
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || !session) return;
  session.message(text);
  input.value = '';
});

window.addEventListener('beforeunload', stopSession);
