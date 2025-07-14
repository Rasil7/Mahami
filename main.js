import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs,
  deleteDoc, updateDoc, doc
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzrkb6xgcyF5aVv3MV3vwJSwieIgyj-ao",
  authDomain: "tasklistweb-43653.firebaseapp.com",
  projectId: "tasklistweb-43653",
  storageBucket: "tasklistweb-43653.appspot.com",
  messagingSenderId: "875266511120",
  appId: "1:875266511120:web:5df1cf617ebd7784a79595",
  measurementId: "G-H694DB31BF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import {
  collection, addDoc, getDocs,
  deleteDoc, updateDoc, doc
} from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js';

let tasks = [];
let cat = 'daily';
let userId = null;

// دوال واجهة المستخدم
function render() {
  const container = document.getElementById("tasksList");
  const filtered = tasks.filter(t => t.cat === cat);
  if (!filtered.length) {
    container.innerHTML = "<p>لا توجد مهام</p>";
    return;
  }
  container.innerHTML = filtered.map(t => `
    <div class="task-item ${t.done ? 'completed' : ''}" data-id="${t.id}">
      <div class="task-text">${t.text}</div>
      <div class="task-meta">${new Date(t.created).toLocaleString()}</div>
      <div class="task-buttons">
        <button class="task-btn complete-btn">${t.done ? "إلغاء" : "إنجاز"}</button>
        <button class="task-btn delete-btn">حذف</button>
      </div>
    </div>
  `).join('');
}

function updateCounts() {
  // يمكن إضافة عداد لاحقًا
}

// تحميل المهام من فايربيس
async function loadTasks() {
  if (!userId) return;
  const snapshot = await getDocs(collection(db, "users", userId, "tasks"));
  tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  render();
  updateCounts();
}

// إضافة مهمة جديدة
document.getElementById('addBtn').onclick = async () => {
  const val = document.getElementById('taskInput').value.trim();
  if (!val || !userId) return;
  const docRef = await addDoc(collection(db, "users", userId, "tasks"), {
    text: val,
    cat,
    done: false,
    created: new Date().toISOString()
  });
  tasks.unshift({ id: docRef.id, text: val, cat, done: false, created: new Date().toISOString() });
  document.getElementById('taskInput').value = '';
  render();
  updateCounts();
};

// حذف أو إنجاز مهمة
document.getElementById('tasksList').addEventListener('click', async (e) => {
  const item = e.target.closest('.task-item');
  if (!item) return;
  const id = item.dataset.id;

  if (e.target.classList.contains('delete-btn')) {
    await deleteDoc(doc(db, "users", userId, "tasks", id));
    tasks = tasks.filter(t => t.id !== id);
    render();
    updateCounts();
  }

  if (e.target.classList.contains('complete-btn')) {
    const task = tasks.find(t => t.id === id);
    const updated = { ...task, done: !task.done };
    await updateDoc(doc(db, "users", userId, "tasks", id), { done: updated.done });
    tasks = tasks.map(t => t.id === id ? updated : t);
    render();
    updateCounts();
  }
});

// حذف كل المهام
document.getElementById('clearBtn').onclick = async () => {
  if (!confirm('هل أنت متأكد من مسح كل المهام؟')) return;
  for (const t of tasks) {
    await deleteDoc(doc(db, "users", userId, "tasks", t.id));
  }
  tasks = [];
  render();
  updateCounts();
};

// التعامل مع تسجيل الدخول بـ Google
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''));
  return JSON.parse(jsonPayload);
}

function handleCredentialResponse(response) {
  const decoded = parseJwt(response.credential);
  userId = decoded.sub;
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('mainApp').classList.add('active');
  document.getElementById('userAvatar').src = decoded.picture;
  document.getElementById('userName').textContent = decoded.name;
  document.getElementById('userInfo').classList.remove('hidden');
  loadTasks();
}

// تسجيل دخول تجريبي
document.getElementById("demoLoginBtn").onclick = () => {
  userId = "demo_user";
  document.getElementById("loginScreen").classList.remove("active");
  document.getElementById("mainApp").classList.add("active");
  document.getElementById('userInfo').classList.add('hidden');
  loadTasks();
};

// تسجيل Google
window.onload = () => {
  google.accounts.id.initialize({
    client_id: "647272644166-5vb58i3eacufm2t6stoe2c2qqs1sc9v5.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });
  google.accounts.id.renderButton(
    document.getElementById("googleSignInBtn"),
    { theme: "outline", size: "large", text: "signin_with" }
  );
};
