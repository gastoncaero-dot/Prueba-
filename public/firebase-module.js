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
    const { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } =
      await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

    window.firebase_modules = {
      initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
      getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs
    };

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    onAuthStateChanged(auth, async (user) => {
      currentUser = user;
      updateAuthUI();
      if (user) await syncFromFirestore();
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
    toast("Sesión cerrada");
  } catch (e) {
    console.error("Logout error:", e);
  }
}

function updateAuthUI() {
  const section = $("#firebase-section");
  const userInfo = $("#user-info");
  const loginBtn = $("#login-btn");
  if (!section) return;

  if (currentUser) {
    section.hidden = false;
    userInfo.textContent = `Registrado como: ${currentUser.email}`;
    if ($("#logout-btn")) $("#logout-btn").onclick = logoutUser;
    if (loginBtn) loginBtn.hidden = true;
  } else {
    section.hidden = true;
    if (loginBtn) loginBtn.hidden = false;
  }
}

async function syncFromFirestore() {
  if (!db || !currentUser) return;
  try {
    const { doc, getDoc } = window.firebase_modules;
    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      Object.assign(state, data);
      refreshAll();
      console.log("Datos sincronizados desde Firestore");
    }
  } catch (e) {
    console.error("Sync from Firestore error:", e);
  }
}

async function syncToFirestore() {
  if (!db || !currentUser) return;
  try {
    const { doc, setDoc } = window.firebase_modules;
    const docRef = doc(db, "users", currentUser.uid);
    await setDoc(docRef, state, { merge: true });
    console.log("Datos sincronizados a Firestore");
  } catch (e) {
    console.error("Sync to Firestore error:", e);
  }
}

function getSaveHandler() {
  return () => {
    localStorage.setItem(KEY, JSON.stringify(state));
    if (currentUser) syncToFirestore();
  };
}

// Reemplazar la función save original cuando Firebase esté listo
let originalSave = save;
window.addEventListener("load", async () => {
  await initFirebase();
});
