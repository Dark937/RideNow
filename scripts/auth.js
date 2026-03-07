/* ═══════════════════════════════════════════════════════════════════
   RIDE — AUTH LOGIC  (scripts/auth.js)
   ═══════════════════════════════════════════════════════════════════ */

"use strict";

/* ── SQLITE DATABASE SETUP ────────────────────────────────────────── */

let db;
let dbReady;

async function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const request = indexedDB.open('rideDB', 1);
  return new Promise((resolve, reject) => {
    request.onupgradeneeded = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains('sqlite')) {
        idb.createObjectStore('sqlite');
      }
    };
    request.onsuccess = () => {
      const idb = request.result;
      const transaction = idb.transaction(['sqlite'], 'readwrite');
      const store = transaction.objectStore('sqlite');
      const putRequest = store.put(data, 'database');
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

async function loadDatabase() {
  return new Promise((resolve) => {
    const request = indexedDB.open('rideDB', 1);
    request.onupgradeneeded = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains('sqlite')) {
        idb.createObjectStore('sqlite');
      }
    };
    request.onsuccess = () => {
      const idb = request.result;
      const transaction = idb.transaction(['sqlite'], 'readonly');
      const store = transaction.objectStore('sqlite');
      const getRequest = store.get('database');
      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
}

async function initDatabase() {
  const SQL = await initSqlJs({ locateFile: file => `assets/${file}` });
  const savedData = await loadDatabase();
  if (savedData) {
    db = new SQL.Database(savedData);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      initials TEXT,
      createdAt TEXT
    )
  `);

  await saveDatabase();
}

dbReady = initDatabase();

/* ── LANGUAGE SYSTEM ──────────────────────────────────────────────── */

const i18n = {
  en: {
    getStarted: 'Get started',
    viewPlans: 'View plans',
    signIn: 'Sign in',
    createAccount: 'Create account',
    myRides: 'My rides',
    fidelityPoints: 'Fidelity points',
    settings: 'Settings',
    signOut: 'Sign out',
    langLabel: 'EN',
  },
  it: {
    getStarted: 'Inizia ora',
    viewPlans: 'Vedi piani',
    signIn: 'Accedi',
    createAccount: 'Crea account',
    myRides: 'I miei viaggi',
    fidelityPoints: 'Punti fedeltà',
    settings: 'Impostazioni',
    signOut: 'Esci',
    langLabel: 'IT',
  }
};

function getCurrentLang() {
  return localStorage.getItem('ride_lang') || 'en';
}

function setLang(lang) {
  localStorage.setItem('ride_lang', lang);
}

/* ── INJECT GLOBAL STYLES (modals, language btn, etc.) ───────────── */

function injectGlobalStyles() {
  if (document.getElementById('ride-auth-global-styles')) return;
  const style = document.createElement('style');
  style.id = 'ride-auth-global-styles';
  style.textContent = `
    /* ── FORGOT PASSWORD MODAL ──────────────────────────────────── */
    .forgot-modal-overlay {
      position: fixed; inset: 0; z-index: 2000;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      opacity: 0; pointer-events: none;
      transition: opacity 0.25s cubic-bezier(.4,0,.2,1);
    }
    .forgot-modal-overlay.is-open {
      opacity: 1; pointer-events: auto;
    }
    .forgot-modal {
      position: relative;
      width: 100%; max-width: 400px;
      background: rgba(12,12,16,0.96);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 24px;
      padding: 40px 36px 36px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07);
      transform: translateY(20px) scale(0.97);
      transition: transform 0.3s cubic-bezier(.22,1,.36,1);
    }
    .forgot-modal-overlay.is-open .forgot-modal {
      transform: translateY(0) scale(1);
    }
    .forgot-close {
      position: absolute; top: 16px; right: 16px;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 8px; color: rgba(255,255,255,0.45);
      transition: color .2s, background .2s;
      background: none; border: none; cursor: pointer;
    }
    .forgot-close:hover { color: #fff; background: rgba(255,255,255,0.07); }
    .forgot-close svg { width: 16px; height: 16px; }
    .forgot-icon {
      width: 52px; height: 52px;
      border-radius: 14px;
      background: rgba(43,106,255,0.12);
      border: 1px solid rgba(43,106,255,0.20);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .forgot-icon svg { width: 24px; height: 24px; stroke: rgba(120,160,255,0.9); fill: none; stroke-width: 1.8; stroke-linecap: round; }
    .forgot-modal h2 {
      font-size: 22px; font-weight: 800;
      letter-spacing: -0.04em; margin-bottom: 8px; color: #fff;
      font-family: "Inter", system-ui, sans-serif;
    }
    .forgot-modal p {
      font-size: 14px; color: rgba(255,255,255,0.52);
      line-height: 1.6; margin-bottom: 0;
      font-family: "Inter", system-ui, sans-serif;
    }
    .forgot-success-icon {
      width: 52px; height: 52px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .forgot-success-icon svg { width: 52px; height: 52px; }
    .forgot-note {
      margin-top: 12px !important;
      font-size: 13px !important;
    }
    .forgot-link-btn {
      background: none; border: none; color: rgba(140,175,255,.9);
      font: inherit; font-size: 13px; cursor: pointer;
      text-decoration: underline; text-underline-offset: 2px;
      padding: 0; transition: color .2s;
    }
    .forgot-link-btn:hover { color: #fff; }

    /* ── SIGN OUT CONFIRMATION MODAL ────────────────────────────── */
    .signout-modal-overlay {
      position: fixed; inset: 0; z-index: 3000;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      opacity: 0; pointer-events: none;
      transition: opacity 0.2s ease;
    }
    .signout-modal-overlay.is-open { opacity: 1; pointer-events: auto; }
    .signout-modal {
      width: 100%; max-width: 340px;
      background: rgba(12,12,16,0.97);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07);
      transform: scale(0.95);
      transition: transform 0.25s cubic-bezier(.22,1,.36,1);
      text-align: center;
      font-family: "Inter", system-ui, sans-serif;
    }
    .signout-modal-overlay.is-open .signout-modal { transform: scale(1); }
    .signout-modal-icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      background: rgba(232,33,58,0.10);
      border: 1px solid rgba(232,33,58,0.18);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .signout-modal-icon svg { width: 22px; height: 22px; stroke: rgba(232,80,80,0.9); fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .signout-modal h3 {
      font-size: 17px; font-weight: 700;
      letter-spacing: -0.03em; color: #fff; margin-bottom: 6px;
    }
    .signout-modal p {
      font-size: 13.5px; color: rgba(255,255,255,0.45); line-height: 1.55; margin-bottom: 22px;
    }
    .signout-modal-actions { display: flex; gap: 10px; }
    .signout-cancel-btn {
      flex: 1; padding: 11px; border-radius: 11px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.75); font-size: 14px; font-weight: 500;
      cursor: pointer; transition: background .2s, color .2s;
      font-family: "Inter", system-ui, sans-serif;
    }
    .signout-cancel-btn:hover { background: rgba(255,255,255,0.09); color: #fff; }
    .signout-confirm-btn {
      flex: 1; padding: 11px; border-radius: 11px;
      border: 1px solid rgba(232,33,58,0.30);
      background: rgba(232,33,58,0.10);
      color: rgba(255,100,100,0.9); font-size: 14px; font-weight: 600;
      cursor: pointer; transition: background .2s, color .2s;
      font-family: "Inter", system-ui, sans-serif;
    }
    .signout-confirm-btn:hover { background: rgba(232,33,58,0.18); color: #ff7070; }

    /* ── LANGUAGE TOGGLE BUTTON ─────────────────────────────────── */
    .lang-toggle-btn {
      display: flex; align-items: center; justify-content: center;
      gap: 5px;
      height: 30px; padding: 0 10px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.78);
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.08em;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      font-family: "Inter", system-ui, sans-serif;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .lang-toggle-btn:hover {
      background: rgba(255,255,255,0.12);
      border-color: rgba(255,255,255,0.30);
      color: #fff;
      transform: translateY(-1px);
    }
    .lang-toggle-btn svg {
      width: 12px; height: 12px;
      opacity: 0.65;
      flex-shrink: 0;
    }

    /* ── PROFILE BUTTON ICON FIX ────────────────────────────────── */
    .profile-btn .circle {
      width: 30px; height: 30px;
      border: 1.5px solid rgba(255,255,255,0.7);
      border-radius: 50%;
      position: relative;
      overflow: visible;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .profile-btn:hover .circle {
      transform: scale(1.06);
      box-shadow: 0 0 16px rgba(255,255,255,0.15);
      border-color: rgba(255,255,255,0.9);
    }
    .profile-btn .circle::before {
      content: "";
      position: absolute;
      top: 5px; left: 50%;
      transform: translateX(-50%);
      width: 8px; height: 8px;
      border-radius: 50%;
      background: transparent;
      border: 1.5px solid rgba(255,255,255,0.8);
    }
    .profile-btn .circle::after {
      content: "";
      position: absolute;
      bottom: 4px; left: 50%;
      transform: translateX(-50%);
      width: 14px; height: 7px;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      border: 1.5px solid rgba(255,255,255,0.8);
      border-bottom: none;
    }
    .profile-btn .circle.is-logged-in::before,
    .profile-btn .circle.is-logged-in::after { display: none; }
    .profile-btn .circle.is-logged-in {
      background: linear-gradient(135deg, #3c82ff, #7055ff);
      font-size: 11px; font-weight: 700; color: #fff;
      letter-spacing: 0.03em;
    }

    /* ── TOPBAR RIGHT CLUSTER ───────────────────────────────────── */
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  `;
  document.head.appendChild(style);
}

/* ── STORAGE HELPERS ──────────────────────────────────────────────── */

const Session = {
  async save(user) {
    await dbReady;
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO users (id, firstName, lastName, email, password, initials, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run([user.id, user.firstName, user.lastName, user.email, user.password || '', user.initials, user.createdAt]);
      stmt.free();
      await saveDatabase();
      localStorage.setItem('current_user_id', user.id);
    } catch (e) {
      console.error('Error saving user:', e);
    }
  },

  async get() {
    await dbReady;
    try {
      const userId = localStorage.getItem('current_user_id');
      if (!userId) return null;
      const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
      const result = stmt.getAsObject([userId]);
      stmt.free();
      if (result.id) {
        delete result.password;
        return result;
      }
      return null;
    } catch (e) {
      console.error('Error getting user:', e);
      return null;
    }
  },

  clear() {
    try {
      localStorage.removeItem('current_user_id');
    } catch (e) {
      console.error('Error clearing session:', e);
    }
  },

  async isLoggedIn() { return !!(await this.get()); }
};

/* ── MOCK AUTH ────────────────────────────────────────────────────── */

const MockAuth = {
  register({ firstName, lastName, email, password }) {
    return new Promise(resolve => {
      setTimeout(async () => {
        try {
          const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
          const existing = checkStmt.getAsObject([email]);
          checkStmt.free();
          if (existing.id) { resolve({ ok: false, error: 'Email already registered.' }); return; }
          const user = {
            id: crypto.randomUUID?.() || Date.now().toString(36),
            firstName, lastName, email, password,
            initials: (firstName[0] + lastName[0]).toUpperCase(),
            createdAt: new Date().toISOString()
          };
          await Session.save(user);
          resolve({ ok: true, user });
        } catch (e) {
          console.error('Register error:', e);
          resolve({ ok: false, error: 'Registration failed.' });
        }
      }, 900);
    });
  },

  login({ email, password }) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
          const user = stmt.getAsObject([email]);
          stmt.free();
          if (!user.id || user.password !== password) {
            resolve({ ok: false, error: 'Invalid email or password.' });
            return;
          }
          delete user.password;
          await Session.save(user);
          resolve({ ok: true, user });
        } catch (e) {
          console.error('Login error:', e);
          resolve({ ok: false, error: 'Login failed.' });
        }
      }, 900);
    });
  }
};

/* ── VALIDATION HELPERS ───────────────────────────────────────────── */

const Validate = {
  email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  minLen:   (v, n) => v.length >= n,
  notEmpty: v => v.trim().length > 0,
};

function fieldError(inputEl, msg) {
  inputEl.classList.add("is-error");
  const errEl = inputEl.closest(".auth-field")?.querySelector(".auth-field-error");
  if (errEl) { errEl.textContent = msg; errEl.classList.add("visible"); }
}

function fieldOk(inputEl) {
  inputEl.classList.remove("is-error");
  const errEl = inputEl.closest(".auth-field")?.querySelector(".auth-field-error");
  if (errEl) errEl.classList.remove("visible");
}

/* ── PASSWORD STRENGTH METER ──────────────────────────────────────── */

function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))            score++;
  if (/[0-9]/.test(pw))            score++;
  if (/[^A-Za-z0-9]/.test(pw))     score++;
  return score;
}

function updateStrengthMeter(pw) {
  const bar   = document.querySelector(".strength-bar");
  const label = document.querySelector(".strength-label");
  if (!bar || !label) return;
  const score  = getStrength(pw);
  const levels = ["", "weak", "fair", "good", "strong"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const spans  = bar.querySelectorAll("span");
  spans.forEach((s, i) => { s.className = i < score ? levels[score] : ""; });
  label.textContent = pw.length ? labels[score] : "";
}

/* ── PASSWORD TOGGLE ──────────────────────────────────────────────── */

function initPasswordToggles() {
  document.querySelectorAll(".auth-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const input  = btn.closest(".auth-field-row").querySelector("input");
      const isText = input.type === "text";
      input.type   = isText ? "password" : "text";
      btn.innerHTML = isText
        ? `<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
        : `<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    });
  });
}

/* ── FORGOT PASSWORD MODAL ────────────────────────────────────────── */

function createForgotPasswordModal() {
  if (document.getElementById('forgotModal')) return document.getElementById('forgotModal');

  const modal = document.createElement('div');
  modal.id = 'forgotModal';
  modal.className = 'forgot-modal-overlay';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="forgot-modal" role="dialog" aria-modal="true" aria-labelledby="forgotTitle">
      <button class="forgot-close" id="forgotClose" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <div class="forgot-icon">
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </div>

      <div id="forgotStep1">
        <h2 id="forgotTitle">Reset your password</h2>
        <p>Enter your email address and we'll send you a link to reset your password.</p>

        <div class="auth-field" style="margin-top: 24px;">
          <label for="forgotEmail">Email address</label>
          <div class="auth-field-row">
            <input type="email" id="forgotEmail" placeholder="you@example.com" autocomplete="email">
          </div>
          <span class="auth-field-error" role="alert"></span>
        </div>

        <button type="button" id="forgotSubmit" class="auth-submit" style="margin-top: 20px;">
          <span class="btn-text">Send reset link</span>
          <span class="spinner" aria-hidden="true"></span>
        </button>

        <div class="auth-error-banner" id="forgotError" role="alert">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p></p>
        </div>
      </div>

      <div id="forgotStep2" style="display:none;">
        <div class="forgot-success-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(34,197,94,0.3)" stroke-width="1.5"/>
            <path d="M7.5 12l3 3 6-6" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2>Check your email</h2>
        <p id="forgotSuccessMsg">We've sent a reset link to <strong></strong>. Check your inbox and follow the instructions.</p>
        <p class="forgot-note">Didn't receive it? Check your spam folder or <button type="button" id="forgotRetry" class="forgot-link-btn">try a different email</button>.</p>
        <button type="button" id="forgotDone" class="auth-submit" style="margin-top: 24px;">
          <span class="btn-text">Back to sign in</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function initForgotPassword() {
  const link = document.getElementById('forgotLink');
  if (!link) return;

  const modal = createForgotPasswordModal();

  function openModal() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('forgotEmail')?.focus(), 100);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      document.getElementById('forgotStep1').style.display = '';
      document.getElementById('forgotStep2').style.display = 'none';
      const emailIn = document.getElementById('forgotEmail');
      if (emailIn) { emailIn.value = ''; fieldOk(emailIn); }
      const banner = document.getElementById('forgotError');
      if (banner) banner.classList.remove('visible');
    }, 300);
  }

  link.addEventListener('click', e => { e.preventDefault(); openModal(); });
  document.getElementById('forgotClose').addEventListener('click', closeModal);
  document.getElementById('forgotDone').addEventListener('click', closeModal);

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  document.getElementById('forgotRetry').addEventListener('click', () => {
    document.getElementById('forgotStep1').style.display = '';
    document.getElementById('forgotStep2').style.display = 'none';
    const emailIn = document.getElementById('forgotEmail');
    if (emailIn) { emailIn.value = ''; emailIn.focus(); fieldOk(emailIn); }
  });

  document.getElementById('forgotSubmit').addEventListener('click', async () => {
    const emailIn = document.getElementById('forgotEmail');
    const submitBtn = document.getElementById('forgotSubmit');
    const banner = document.getElementById('forgotError');

    fieldOk(emailIn);
    banner.classList.remove('visible');

    if (!Validate.email(emailIn.value)) {
      fieldError(emailIn, 'Please enter a valid email address.');
      return;
    }

    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;
    await new Promise(r => setTimeout(r, 1200));
    submitBtn.classList.remove('is-loading');
    submitBtn.disabled = false;

    const successMsg = document.querySelector('#forgotSuccessMsg strong');
    if (successMsg) successMsg.textContent = emailIn.value.trim();
    document.getElementById('forgotStep1').style.display = 'none';
    document.getElementById('forgotStep2').style.display = '';
  });
}

/* ── SIGN OUT CONFIRMATION ────────────────────────────────────────── */

function createSignOutModal() {
  if (document.getElementById('signoutModal')) return document.getElementById('signoutModal');

  const modal = document.createElement('div');
  modal.id = 'signoutModal';
  modal.className = 'signout-modal-overlay';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="signout-modal" role="dialog" aria-modal="true">
      <div class="signout-modal-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </div>
      <h3>Sign out?</h3>
      <p>You'll be returned to the home page and will need to sign in again to access your account.</p>
      <div class="signout-modal-actions">
        <button class="signout-cancel-btn" id="signoutCancel">Cancel</button>
        <button class="signout-confirm-btn" id="signoutConfirm">Sign out</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

/* ── LANGUAGE TOGGLE ──────────────────────────────────────────────── */

function createLangToggle(container) {
  const btn = document.createElement('button');
  btn.className = 'lang-toggle-btn';
  btn.setAttribute('aria-label', 'Toggle language');
  btn.setAttribute('id', 'langToggleBtn');

  const lang = getCurrentLang();
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
    </svg>
    <span>${lang.toUpperCase()}</span>
  `;

  btn.addEventListener('click', () => {
    const current = getCurrentLang();
    const next = current === 'en' ? 'it' : 'en';
    setLang(next);
    btn.querySelector('span').textContent = next.toUpperCase();
    // Reload to apply translations
    window.location.reload();
  });

  container.appendChild(btn);
  return btn;
}

/* ── LOGIN FORM ───────────────────────────────────────────────────── */

function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const emailIn   = document.getElementById("loginEmail");
  const passIn    = document.getElementById("loginPassword");
  const submitBtn = document.getElementById("loginSubmit");
  const banner    = document.getElementById("loginError");

  function showBanner(msg) { banner.querySelector("p").textContent = msg; banner.classList.add("visible"); }
  function hideBanner()    { banner.classList.remove("visible"); }
  function setLoading(on)  { submitBtn.classList.toggle("is-loading", on); submitBtn.disabled = on; }

  emailIn.addEventListener("input", () => { fieldOk(emailIn); hideBanner(); });
  passIn.addEventListener("input",  () => { fieldOk(passIn);  hideBanner(); });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    hideBanner();
    let valid = true;
    if (!Validate.email(emailIn.value)) { fieldError(emailIn, "Please enter a valid email address."); valid = false; }
    if (!Validate.minLen(passIn.value, 3)) { fieldError(passIn, "Password is required."); valid = false; }
    if (!valid) return;
    setLoading(true);
    const result = await MockAuth.login({ email: emailIn.value.trim(), password: passIn.value });
    setLoading(false);
    if (!result.ok) { showBanner(result.error); return; }
    await Session.save(result.user);
    const redirect = new URLSearchParams(window.location.search).get("redirect") || "index.html";
    window.location.href = redirect;
  });

  initForgotPassword();
}

/* ── REGISTER FORM ────────────────────────────────────────────────── */

function initRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  const firstIn   = document.getElementById("regFirst");
  const lastIn    = document.getElementById("regLast");
  const emailIn   = document.getElementById("regEmail");
  const passIn    = document.getElementById("regPassword");
  const confirmIn = document.getElementById("regConfirm");
  const termsIn   = document.getElementById("regTerms");
  const submitBtn = document.getElementById("registerSubmit");
  const banner    = document.getElementById("registerError");

  function showBanner(msg) { banner.querySelector("p").textContent = msg; banner.classList.add("visible"); }
  function hideBanner()    { banner.classList.remove("visible"); }
  function setLoading(on)  { submitBtn.classList.toggle("is-loading", on); submitBtn.disabled = on; }

  passIn.addEventListener("input", () => { fieldOk(passIn); hideBanner(); updateStrengthMeter(passIn.value); });
  [firstIn, lastIn, emailIn, confirmIn].forEach(el =>
    el.addEventListener("input", () => { fieldOk(el); hideBanner(); })
  );

  form.addEventListener("submit", async e => {
    e.preventDefault();
    hideBanner();
    let valid = true;
    if (!Validate.notEmpty(firstIn.value)) { fieldError(firstIn, "First name is required."); valid = false; }
    if (!Validate.notEmpty(lastIn.value))  { fieldError(lastIn,  "Last name is required."); valid = false; }
    if (!Validate.email(emailIn.value))    { fieldError(emailIn, "Please enter a valid email address."); valid = false; }
    if (!Validate.minLen(passIn.value, 8)) { fieldError(passIn,  "Password must be at least 8 characters."); valid = false; }
    if (passIn.value !== confirmIn.value)  { fieldError(confirmIn, "Passwords do not match."); valid = false; }
    if (!termsIn.checked) { showBanner("You must agree to the Terms of Service."); valid = false; }
    if (!valid) return;
    setLoading(true);
    const result = await MockAuth.register({
      firstName: firstIn.value.trim(),
      lastName:  lastIn.value.trim(),
      email:     emailIn.value.trim(),
      password:  passIn.value
    });
    setLoading(false);
    if (!result.ok) { showBanner(result.error); return; }
    await Session.save(result.user);
    window.location.href = "index.html";
  });
}

/* ── TOPBAR DROPDOWN (index.html) ─────────────────────────────────── */

async function initTopbarDropdown() {
  const profileBtn  = document.querySelector(".profile-btn");
  const profileWrap = document.querySelector(".profile-btn-wrap");
  const dropdown    = document.getElementById("profileDropdown");
  if (!profileBtn || !dropdown) return;

  const user = await Session.get();

  // Wrap profileBtn and its sibling into a cluster div if not already done
  // Also inject lang toggle for guests into topbar
  const topbar = document.querySelector(".topbar");

  if (user) {
    const circle = profileBtn.querySelector(".circle");
    if (circle) {
      circle.classList.add("is-logged-in");
      circle.textContent = user.initials || "R";
    }

    const ddName  = dropdown.querySelector(".dd-name");
    const ddEmail = dropdown.querySelector(".dd-email");
    if (ddName)  ddName.textContent  = `${user.firstName} ${user.lastName}`.trim();
    if (ddEmail) ddEmail.textContent = user.email || "";

    dropdown.querySelectorAll("[data-guest]").forEach(el => el.style.display = "none");
    dropdown.querySelectorAll("[data-user]").forEach(el => el.style.display = "");

    // Update settings link in dropdown to go to settings.html
    const settingsLink = dropdown.querySelector('.dd-item[href="#"]');
    if (settingsLink) {
      // Find the one with settings icon (3rd item)
      const allItems = dropdown.querySelectorAll('.dd-item');
      allItems.forEach(item => {
        if (item.textContent.trim().includes('Settings') || item.textContent.trim().includes('Impostazioni')) {
          item.href = 'settings.html';
        }
      });
    }

    // Sign out with confirmation modal
    const signoutModal = createSignOutModal();

    dropdown.querySelector(".dd-signout")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.remove("is-open");
      signoutModal.classList.add('is-open');
      signoutModal.setAttribute('aria-hidden', 'false');
    });

    document.getElementById('signoutCancel')?.addEventListener('click', () => {
      signoutModal.classList.remove('is-open');
      signoutModal.setAttribute('aria-hidden', 'true');
    });

    document.getElementById('signoutConfirm')?.addEventListener('click', () => {
      Session.clear();
      signoutModal.classList.remove('is-open');
      window.location.reload();
    });

    signoutModal.addEventListener('click', e => {
      if (e.target === signoutModal) {
        signoutModal.classList.remove('is-open');
        signoutModal.setAttribute('aria-hidden', 'true');
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && signoutModal.classList.contains('is-open')) {
        signoutModal.classList.remove('is-open');
        signoutModal.setAttribute('aria-hidden', 'true');
      }
    });

  } else {
    dropdown.querySelectorAll("[data-user]").forEach(el => el.style.display = "none");
    dropdown.querySelectorAll("[data-guest]").forEach(el => el.style.display = "");

    // Inject language toggle button for guests in topbar (next to profile btn)
    if (topbar && profileWrap) {
      // Wrap in a flex container if not already
      let cluster = profileWrap.closest('.topbar-right');
      if (!cluster) {
        cluster = document.createElement('div');
        cluster.className = 'topbar-right';
        profileWrap.parentNode.insertBefore(cluster, profileWrap);
        cluster.appendChild(profileWrap);
      }
      createLangToggle(cluster);
      // Move lang button before profile wrap
      cluster.insertBefore(cluster.querySelector('.lang-toggle-btn'), profileWrap);
    }
  }

  profileBtn.addEventListener("click", e => {
    e.stopPropagation();
    dropdown.classList.toggle("is-open");
  });

  document.addEventListener("click", e => {
    if (profileWrap && !profileWrap.closest('.topbar-right')?.contains(e.target) &&
        !profileWrap.contains(e.target)) {
      dropdown.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") dropdown.classList.remove("is-open");
  });
}

/* ── SOCIAL BUTTONS ───────────────────────────────────────────────── */

function initSocialButtons() {
  document.querySelectorAll(".auth-social-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      alert("Social sign-in coming soon. Use email & password for now.");
    });
  });
}

/* ── BOOTSTRAP ────────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", async () => {
  injectGlobalStyles();
  initPasswordToggles();
  initLoginForm();
  initRegisterForm();
  await initTopbarDropdown();
  initSocialButtons();
});