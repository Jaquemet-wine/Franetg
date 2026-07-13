// Normalise une chaîne : majuscules, sans accents, sans espaces superflus
function normalize(str) {
  return str
    .toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Vérifie la réponse d'une énigme.
// answers = tableau de réponses valides (normalisées en interne)
function checkAnswer(inputId, feedbackId, answers, nextUrl, stepLabel) {
  const input = document.getElementById(inputId);
  const feedback = document.getElementById(feedbackId);
  const val = normalize(input.value);
  const ok = answers.some(a => normalize(a) === val);

  if (ok) {
    feedback.textContent = "✓ Correct. Redirection…";
    feedback.className = "feedback ok";
    input.disabled = true;
    localStorage.setItem("defi_progress", nextUrl.replace(".html",""));
    if (stepLabel) recordStep(stepLabel);
    setTimeout(() => { window.location.href = nextUrl; }, 900);
  } else {
    feedback.textContent = "✗ Ce n'est pas ça. Réessaie.";
    feedback.className = "feedback err";
  }
}

function bindEnter(inputId, cb) {
  document.getElementById(inputId).addEventListener("keydown", e => {
    if (e.key === "Enter") cb();
  });
}

// ---------- Suivi Formspree : un seul mail récapitulatif par visite ----------
const FORM_URL = "https://formspree.io/f/xlgqenvd";

// Enregistre localement une étape franchie (sans envoyer de mail immédiatement)
function recordStep(step) {
  const steps = JSON.parse(localStorage.getItem("defi_steps") || "[]");
  if (!steps.includes(step)) {
    steps.push(step);
    localStorage.setItem("defi_steps", JSON.stringify(steps));
  }
}

// Envoie le récapitulatif complet (une seule fois par progression atteinte)
function sendSummary(finished) {
  const name = localStorage.getItem("defi_name") || "Anonyme";
  const steps = JSON.parse(localStorage.getItem("defi_steps") || "[]");
  if (steps.length === 0) return; // rien à signaler (n'a même pas commencé)

  const signature = steps.length + (finished ? "-fin" : "");
  if (sessionStorage.getItem("defi_last_sent") === signature) return; // déjà envoyé pour cette progression
  sessionStorage.setItem("defi_last_sent", signature);

  const summary =
    "Énigmes réussies :\n- " + steps.join("\n- ") +
    "\n\nArrivé jusqu'au bout : " + (finished ? "OUI 🎉" : "Non (abandon ou en cours)");

  const data = new FormData();
  data.append("nom", name);
  data.append("recapitulatif", summary);

  // sendBeacon est plus fiable que fetch au moment où la page se ferme
  if (navigator.sendBeacon) {
    navigator.sendBeacon(FORM_URL, data);
  } else {
    fetch(FORM_URL, { method: "POST", body: data, keepalive: true }).catch(() => {});
  }
}

// Envoie automatiquement le récap quand la personne quitte une page (nouvelle progression uniquement)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") sendSummary(false);
});
window.addEventListener("pagehide", () => sendSummary(false));

// Petite pluie de pétales pour la page finale
function launchPetals() {
  const emojis = ["🌸", "❤️", "✨"];
  for (let i = 0; i < 40; i++) {
    setTimeout(() => {
      const p = document.createElement("div");
      p.className = "petal";
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.left = Math.random() * 100 + "vw";
      p.style.animationDuration = (4 + Math.random() * 3) + "s";
      p.style.fontSize = (14 + Math.random() * 14) + "px";
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 8000);
    }, i * 120);
  }
}

// ---------- Musique de fond, continue d'une page à l'autre ----------
function updateMusicIcon(muted) {
  const btn = document.getElementById("music-toggle");
  if (btn) btn.textContent = muted ? "🔇" : "🔊";
}

function toggleMusic() {
  const audio = document.getElementById("bgm");
  if (!audio) return;
  audio.muted = !audio.muted;
  localStorage.setItem("bgm_muted", audio.muted ? "1" : "0");
  updateMusicIcon(audio.muted);
}

function initMusic() {
  const audio = document.getElementById("bgm");
  if (!audio) return;

  const savedTime = parseFloat(localStorage.getItem("bgm_time") || "0");
  const muted = localStorage.getItem("bgm_muted") === "1";
  if (!isNaN(savedTime)) audio.currentTime = savedTime;
  audio.muted = muted;
  updateMusicIcon(muted);

  const tryPlay = () => audio.play().catch(() => {});
  tryPlay();
  // Si le navigateur bloque l'autoplay, on démarre au premier clic/toucher
  document.addEventListener("click", tryPlay, { once: true });
  document.addEventListener("touchstart", tryPlay, { once: true });

  setInterval(() => {
    localStorage.setItem("bgm_time", audio.currentTime);
  }, 1000);
  window.addEventListener("beforeunload", () => {
    localStorage.setItem("bgm_time", audio.currentTime);
  });
}
document.addEventListener("DOMContentLoaded", initMusic);
