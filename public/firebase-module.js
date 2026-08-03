let db = null, auth = null, currentUser = null;

async function initFirebase() {
  if (!FIREBASE_ENABLED) return;

  try {
    await loadFirebaseSDK();
    const app = window.firebase.initializeApp(firebaseConfig);
    auth = window.firebase.auth();
    db = window.firebase.firestore();

    auth.onAuthStateChanged(async (user) => {
      currentUser = user;
      updateAppUI();
      if (user) await loadUserData();
    });

    console.log("Firebase inicializado correctamente");
  } catch (e) {
    console.error("Firebase init error:", e);
    toast("Error al inicializar Firebase");
  }
}

function loadFirebaseSDK() {
  return new Promise((resolve, reject) => {
    if (window.firebase) {
      resolve();
      return;
    }

    const scripts = [
      "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
      "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js",
      "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"
    ];

    let loaded = 0;
    scripts.forEach(src => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        loaded++;
        if (loaded === scripts.length) resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  });
}

async function loginWithGoogle() {
  if (!auth) {
    toast("Firebase no está inicializado");
    return;
  }
  try {
    const provider = new window.firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  } catch (e) {
    console.error("Login error:", e);
    toast(`Error: ${e.message || "Error al iniciar sesión"}`);
  }
}

async function logoutUser() {
  try {
    await auth.signOut();
    localStorage.removeItem(KEY);
    location.reload();
  } catch (e) {
    console.error("Logout error:", e);
    toast("Error al cerrar sesión");
  }
}

function updateAppUI() {
  const loginScreen = $("#login-screen");
  const welcome = $("#welcome");
  const app = $("#app");

  if (!currentUser) {
    if (loginScreen) loginScreen.hidden = false;
    if (welcome) welcome.hidden = true;
    if (app) app.hidden = true;
  } else {
    if (loginScreen) loginScreen.hidden = true;
    if (state.baby) {
      if (welcome) welcome.hidden = true;
      if (app) app.hidden = false;
    } else {
      if (welcome) welcome.hidden = false;
      if (app) app.hidden = true;
    }
  }

  updateSettingsUI();
}

function updateSettingsUI() {
  const section = $("#firebase-section");
  const userInfo = $("#user-info");
  if (!section) return;

  if (currentUser) {
    section.hidden = false;
    if (userInfo) userInfo.textContent = `Registrado como: ${currentUser.email}`;
    if ($("#logout-btn")) $("#logout-btn").onclick = logoutUser;
  } else {
    section.hidden = true;
  }
}

async function loadUserData() {
  if (!currentUser) return;
  try {
    const db_ref = db.collection("users").doc(currentUser.uid);
    const doc_snap = await db_ref.get();

    if (doc_snap.exists) {
      const data = doc_snap.data();
      Object.assign(state, data);
      localStorage.setItem(KEY, JSON.stringify(state));
      refreshAll();
      console.log("Datos cargados desde Firestore");
    }
    updateAppUI();
  } catch (e) {
    console.error("Load error:", e);
  }
}

async function syncToFirestore() {
  if (!currentUser) return;
  try {
    const db_ref = db.collection("users").doc(currentUser.uid);
    await db_ref.set(state, { merge: true });
  } catch (e) {
    console.error("Sync error:", e);
  }
}

window.addEventListener("load", async () => {
  await initFirebase();
  if (!FIREBASE_ENABLED) {
    const loginScreen = $("#login-screen");
    const welcome = $("#welcome");
    if (loginScreen) loginScreen.hidden = true;
    if (welcome) welcome.hidden = false;
  }
});
