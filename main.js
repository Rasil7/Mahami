import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js';

let tasks = [];
let cat = 'daily';
let language = 'ar';
let userId = null;
let isGoogleUser = false;

async function loadTasks() {
  if (!userId) return;
  const snapshot = await getDocs(collection(db, "users", userId, "tasks"));
  tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  render();
  updateCounts();
}

document.getElementById('addBtn').onclick = async () => {
  const val = document.getElementById('taskInput').value.trim();
  if (val && userId) {
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
  }
};

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
};

document.getElementById('clearBtn').onclick = async () => {
  if (tasks.length === 0) {
    alert(language === 'ar' ? 'لا توجد مهام للمسح' : 'No tasks to clear');
    return;
  }
  const confirmDelete = confirm(language === 'ar' ? 'هل أنت متأكد من مسح جميع المهام؟' : 'Are you sure?');
  if (!confirmDelete) return;

  for (const task of tasks) {
    await deleteDoc(doc(db, "users", userId, "tasks", task.id));
  }
  tasks = [];
  render();
  updateCounts();
};

// تسجيل دخول جوجل
function handleCredentialResponse(response) {
  const decoded = parseJwt(response.credential);
  userId = decoded.sub;
  isGoogleUser = true;
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
  isGoogleUser = false;
  document.getElementById("loginScreen").classList.remove("active");
  document.getElementById("mainApp").classList.add("active");
  document.getElementById('userInfo').classList.add('hidden');
  loadTasks();
};

window.onload = () => {
  google.accounts.id.initialize({
    client_id: "647272644166-5vb58i3eacufm2t6stoe2c2qqs1sc9v5.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });
  google.accounts.id.renderButton(
    document.getElementById("googleSignInBtn"),
    { theme: "outline", size: "large", text: "signin_with" }
  );
  setLanguage(language);
};

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''));
  return JSON.parse(jsonPayload);
}

// تحتاج تضيف دوال render و updateCounts و setLanguage حسب تصميمك
