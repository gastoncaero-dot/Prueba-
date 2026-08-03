/* ═══════════════════════════════════════════════════════════════
   Firebase Integration Module
   ═══════════════════════════════════════════════════════════════ */

let db = null, auth = null, currentUser = null;

async function initFirebase() {
  if (!FIREBASE_ENABLED) return;

  try {
    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"
    );
    const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } =
      await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    const { getFirestore, doc, setDoc, getDoc } =
      await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

    window.firebase_modules = {
      initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
      getFirestore, doc, setDoc, getDoc
    };

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    onAuthStateChanged(auth, async (user) => {
      currentUser = user;
      updateAppUI();
      if (user) await loadUserData();
    });
  } catch (e) {
    console.error("Firebase init error:", e);
  }
}

async function loginWithGoogle() {
  if (!auth) return;
  try {
    const { GoogleAuthProvider, signInWithPopup } = window.firebase_modules;
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error("Login error:", e);
    toast("Error al iniciar sesión");
  }
}

async function logoutUser() {
  if (!auth) return;
  try {
    const { signOut } = window.firebase_modules;
    await signOut(auth);
    localStorage.removeItem(KEY);
    location.reload();
  } catch (e) {
    console.error("Logout error:", e);
  }
}

function updateAppUI() {
  const loginScreen = $("#login-screen");
  const welcome = $("#welcome");
  const app = $("#app");

  if (!currentUser) {
    loginScreen.hidden = false;
    welcome.hidden = true;
    app.hidden = true;
  } else {
    loginScreen.hidden = true;
    if (state.baby) {
      welcome.hidden = true;
      app.hidden = false;
    } else {
      welcome.hidden = false;
      app.hidden = true;
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
    userInfo.textContent = `Registrado como: ${currentUser.email}`;
    if ($("#logout-btn")) $("#logout-btn").onclick = logoutUser;
  } else {
    section.hidden = true;
  }
}

async function loadUserData() {
  if (!db || !currentUser) return;
  try {
    const { doc, getDoc } = window.firebase_modules;
    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
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
  if (!db || !currentUser) return;
  try {
    const { doc, setDoc } = window.firebase_modules;
    const docRef = doc(db, "users", currentUser.uid);
    await setDoc(docRef, state, { merge: true });
  } catch (e) {
    console.error("Sync error:", e);
  }
}

window.addEventListener("load", async () => {
  await initFirebase();
  // Mostrar login screen por defecto
  if (!FIREBASE_ENABLED) {
    $("#login-screen").hidden = true;
    $("#welcome").hidden = false;
  }
});
