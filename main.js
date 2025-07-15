const translations = {
  ar: {
    add: "إضافة مهمة",
    clear: "مسح الكل",
    complete: "إنجاز",
    cancel: "إلغاء",
    delete: "حذف",
    daily: "المهام اليومية",
    weekly: "المهام الأسبوعية",
    monthly: "المهام الشهرية",
    "year goal": "الأهداف السنوية",
    placeholder: "أكتب مهمة جديدة...",
    title: "قائمة المهام",
    subtitle: "ابدأ بإدارة مهامك الآن",
    demo: "تجربة التطبيق",
    signin: "تسجيل الدخول باستخدام Google",
    confirmClear: "هل أنت متأكد؟",
    empty: "لا توجد مهام في هذه الفئة<br>ابدأ بإضافة مهمة جديدة!"
  },
  en: {
    add: "Add Task",
    clear: "Clear All",
    complete: "Complete",
    cancel: "Undo",
    delete: "Delete",
    daily: "Daily Tasks",
    weekly: "Weekly Tasks",
    monthly: "Monthly Tasks",
    "year goal": "Yearly Goals",
    placeholder: "Write a new task...",
    title: "Task List",
    subtitle: "Start managing your tasks now",
    demo: "Try App",
    signin: "Sign in with Google",
    confirmClear: "Are you sure?",
    empty: "No tasks in this category<br>Start by adding one!"
  }
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
  document.getElementById('googleLoginBtn').textContent = translations[lang].signin;
  document.getElementById('langToggle').textContent = lang === 'ar' ? 'English' : 'العربية';
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('.category-tab').forEach(tab => {
    const c = tab.dataset.cat;
    tab.querySelector('span').textContent = translations[lang][c];
  });
  render();
}

document.getElementById('langToggle').onclick = () => {
  setLanguage(language === 'ar' ? 'en' : 'ar');
};

document.getElementById("demoLoginBtn").onclick = () => {
  userId = null;
  document.getElementById("loginScreen").classList.remove("active");
  document.getElementById("mainApp").classList.add("active");
  document.getElementById('userInfo').classList.add('hidden');
  render();
};

document.getElementById("googleLoginBtn").onclick = async () => {
  const { auth, GoogleAuthProvider, signInWithPopup, db, doc, getDoc, setDoc } = window.firebaseConfig;
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    userId = user.uid;
    document.getElementById("loginScreen").classList.remove("active");
    document.getElementById("mainApp").classList.add("active");
    document.getElementById("userAvatar").src = user.photoURL;
    document.getElementById("userName").textContent = user.displayName;
    document.getElementById("userInfo").classList.remove("hidden");

    // Load user tasks
    const docRef = doc(db, "tasks", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      tasks = docSnap.data().list || [];
    }
    updateCounts();
    render();
  } catch (error) {
    alert("فشل تسجيل الدخول");
    console.error(error);
  }
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function updateCounts() {
  ['daily', 'weekly', 'monthly', 'year goal'].forEach(c => {
    const count = tasks.filter(t => t.cat === c && !t.done).length;
    const el = document.getElementById(c + 'Count');
    if (el) el.textContent = count;
  });
}

function render() {
  const list = document.getElementById('tasksList');
  const filtered = tasks.filter(t => t.cat === cat);
  if (!filtered.length) {
    list.innerHTML = `<div style="text-align: center; padding: 40px; color: #666;">${translations[language].empty}</div>`;
    return;
  }
  list.innerHTML = filtered.map(t => `
    <div class="task-item${t.done ? ' completed' : ''}" data-id="${t.id}">
      <div class="task-text">${t.text}</div>
      <div class="task-meta">${formatDate(t.created)}</div>
      <div class="task-buttons">
        <button class="task-btn complete-btn">${t.done ? translations[language].cancel : translations[language].complete}</button>
        <button class="task-btn delete-btn">${translations[language].delete}</button>
      </div>
    </div>
  `).join('');
}

function saveTasks() {
  if (!userId) return;
  const { db, doc, setDoc } = window.firebaseConfig;
  setDoc(doc(db, "tasks", userId), { list: tasks });
}

document.querySelectorAll('.category-tab').forEach(el => {
  el.onclick = () => {
    document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
    el.classList.add('active');
    cat = el.dataset.cat;
    render();
    updateCounts();
  };
});

document.getElementById('addBtn').onclick = () => {
  const val = document.getElementById('taskInput').value.trim();
  if (val) {
    tasks.unshift({ id: Date.now(), text: val, cat, done: false, created: new Date().toISOString() });
    document.getElementById('taskInput').value = '';
    render();
    updateCounts();
    saveTasks();
  }
};

document.getElementById('taskInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('addBtn').click();
});

document.getElementById('clearBtn').onclick = () => {
  if (!tasks.length) {
    alert(language === 'ar' ? 'لا توجد مهام للمسح' : 'No tasks to clear');
    return;
  }
  const confirmClear = confirm(translations[language].confirmClear);
  if (confirmClear) {
    tasks = [];
    render();
    updateCounts();
    saveTasks();
  }
};

document.getElementById('tasksList').addEventListener('click', e => {
  const item = e.target.closest('.task-item');
  if (!item) return;
  const id = +item.dataset.id;
  if (e.target.classList.contains('complete-btn')) {
    tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  } else if (e.target.classList.contains('delete-btn')) {
    tasks = tasks.filter(t => t.id !== id);
  }
  render();
  updateCounts();
  saveTasks();
});

setLanguage(language);
