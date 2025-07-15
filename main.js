import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const { auth, db } = window.firebase;

const translations = {
  ar: { /* …نصوص الترجمة بالكامل كما بالصورة السابقة… */ },
  en: { /* …كنسخة انجليزي… */ }
};

let language = 'ar';
let tasks = [];
let cat = 'daily';
let userId = null;

function setLanguage(lang) {
  language = lang;
  document.getElementById('addBtn').textContent = translations[lang].add;
  document.getElementById('clearBtn').textContent = translations[lang].clear;
  document.getElementById('taskInput').placeholder = translations[lang].placeholder;
  document.querySelector('.login-title').textContent = translations[lang].title;
  document.querySelector('.login-subtitle').textContent = translations[lang].subtitle;
  document.querySelector('.title').textContent = translations[lang].title;
  document.getElementById('demoLoginBtn').textContent = translations[lang].demo;
  document.getElementById('langToggle').textContent = lang === 'ar'? 'English':'العربية';
  document.body.dir = lang === 'ar'? 'rtl':'ltr';
  document.querySelectorAll('.category-tab').forEach(tab => {
    const c = tab.dataset.cat;
    tab.querySelector('span').textContent = translations[lang][c];
  });
  render();
}

document.getElementById('langToggle').onclick = () => setLanguage(language === 'ar'? 'en':'ar');

window.onload = () => {
  getAuth(auth); // تفعيل Auth
  google.accounts.id.initialize({ client_id:"647272644166-…", callback: handleCredentialResponse });
  google.accounts.id.renderButton(document.getElementById("googleSignInBtn"), { theme:"outline", size:"large", text:"signin_with" });
  setLanguage(language);
};

function handleCredentialResponse(res) {
  signInWithPopup(auth, new GoogleAuthProvider())
    .then(result => {
      const user = result.user;
      userId = user.uid;
      document.getElementById("loginScreen").classList.remove("active");
      document.getElementById("mainApp").classList.add("active");
      document.getElementById("userAvatar").src = user.photoURL;
      document.getElementById("userName").textContent = user.displayName;
      document.getElementById("userInfo").classList.remove("hidden");
      loadTasks();
    })
    .catch(console.error);
}

document.getElementById("demoLoginBtn").onclick = () => {
  userId = "demo_user";
  document.getElementById("loginScreen").classList.remove("active");
  document.getElementById("mainApp").classList.add("active");
  document.getElementById("userInfo").classList.add("hidden");
  loadTasks();
};

async function loadTasks() {
  if (!userId) return;
  const q = await getDocs(collection(db, "users", userId, "tasks"));
  tasks = q.docs.map(d => ({ id: d.id, ...d.data() }));
  render(); updateCounts();
}

function render() {
  const out = document.getElementById("tasksList");
  const filtered = tasks.filter(t => t.cat === cat);
  if (!filtered.length) {
    out.innerHTML = `<div style="text-align:center; color:#666;">${translations[language].empty}</div>`;
    return;
  }
  out.innerHTML = filtered.map(t => `
    <div class="task-item${t.done?" completed":""}" data-id="${t.id}">
      <div class="task-text">${t.text}</div>
      <div class="task-meta">${new Date(t.created).toLocaleString()}</div>
      <div class="task-buttons">
        <button class="task-btn complete-btn">${t.done?translations[language].cancel:translations[language].complete}</button>
        <button class="task-btn delete-btn">${translations[language].delete}</button>
      </div>
    </div>
  `).join('');
}

function updateCounts() {
  ['daily','weekly','monthly','year goal'].forEach(c => {
    const cnt = tasks.filter(t=>t.cat===c&&!t.done).length;
    const e = document.getElementById(c+"Count");
    if (e) e.textContent = cnt;
  });
}

// إضافة وتعديل وحذف مع حفظ في Firestore
document.getElementById('addBtn').onclick = async () => {
  const val = document.getElementById('taskInput').value.trim();
  if (!val || !userId) return;
  const d = await addDoc(collection(db, "users", userId, "tasks"), {
    text: val, cat, done:false, created:new Date().toISOString()
  });
  tasks.unshift({ id:d.id, text: val, cat, done:false, created:new Date().toISOString() });
  render(); updateCounts();
};

document.getElementById('tasksList').addEventListener('click', async e=>{
  const x = e.target.closest('.task-item');
  if (!x) return;
  const id = x.dataset.id;
  const t = tasks.find(r=>r.id===id);
  if (e.target.classList.contains("complete-btn")) {
    await updateDoc(doc(db,"users",userId,"tasks",id),{ done: !t.done });
    t.done = !t.done;
  }
  if (e.target.classList.contains("delete-btn")) {
    await deleteDoc(doc(db,"users",userId,"tasks",id));
    tasks = tasks.filter(r=>r.id!==id);
  }
  render(); updateCounts();
});

document.getElementById('clearBtn').onclick = async ()=>{
  if (!confirm(translations[language].confirmClear)) return;
  for (const t of tasks) {
    await deleteDoc(doc(db, "users", userId, "tasks", t.id));
  }
  tasks = []; render(); updateCounts();
};
