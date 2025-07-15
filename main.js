// === Firebase إعداد ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// === Firebase config ===
const firebaseConfig = {
  apiKey: "AIzaSyBzrkb6xgcyF5aVv3MV3vwJSwieIgyj-ao",
  authDomain: "tasklistweb-43653.firebaseapp.com",
  projectId: "tasklistweb-43653",
  storageBucket: "tasklistweb-43653.appspot.com",
  messagingSenderId: "875266511120",
  appId: "1:875266511120:web:5df1cf617ebd7784a79595",
  measurementId: "G-H694DB31BF"
};

// === Firebase init ===
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// === DOM elements ===
const loginScreen = document.getElementById("loginScreen");
const mainApp = document.getElementById("mainApp");
const loginBtn = document.getElementById("loginBtn");
const addBtn = document.getElementById("addBtn");
const clearBtn = document.getElementById("clearBtn");
const taskInput = document.getElementById("taskInput");
const tasksList = document.getElementById("tasksList");
const langToggle = document.getElementById("langToggle");

const userName = document.getElementById("userName");
const userAvatar = document.getElementById("userAvatar");

let currentUser = null;
let currentCategory = "daily";
let language = "ar";

// === الترجمات ===
const translations = {
  ar: {
    daily: "المهام اليومية",
    weekly: "المهام الأسبوعية",
    monthly: "المهام الشهرية",
    year: "أهداف السنة",
    add: "إضافة مهمة",
    clear: "مسح الكل",
    placeholder: "أكتب مهمة جديدة...",
    noTasks: "لا توجد مهام. أبدأ بإضافة مهمة جديدة!",
    login: "تسجيل الدخول باستخدام Google",
    logout: "تسجيل الخروج",
    title: "قائمة المهام"
  },
  en: {
    daily: "Daily Tasks",
    weekly: "Weekly Tasks",
    monthly: "Monthly Tasks",
    year: "Year Goals",
    add: "Add Task",
    clear: "Clear All",
    placeholder: "Write a new task...",
    noTasks: "No tasks. Start by adding one!",
    login: "Login with Google",
    logout: "Logout",
    title: "Task List"
  }
};

// === Login ===
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    alert("فشل تسجيل الدخول");
    console.error(err);
  }
});

// === Auth listener ===
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    loginScreen.classList.remove("active");
    mainApp.classList.add("active");
    userName.textContent = user.displayName;
    userAvatar.src = user.photoURL;
    loadTasks();
  } else {
    currentUser = null;
    loginScreen.classList.add("active");
    mainApp.classList.remove("active");
  }
});

// === إضافة مهمة ===
addBtn.addEventListener("click", async () => {
  const text = taskInput.value.trim();
  if (text && currentUser) {
    await addDoc(collection(db, "tasks"), {
      text,
      category: currentCategory,
      uid: currentUser.uid,
      completed: false,
      createdAt: new Date()
    });
    taskInput.value = "";
    loadTasks();
  }
});

// === تحميل المهام ===
async function loadTasks() {
  tasksList.innerHTML = "";
  const q = query(collection(db, "tasks"), where("uid", "==", currentUser.uid), where("category", "==", currentCategory));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    tasksList.innerHTML = `<p>${translations[language].noTasks}</p>`;
    return;
  }

  snapshot.forEach(docSnap => {
    const task = docSnap.data();
    const div = document.createElement("div");
    div.className = "task-item" + (task.completed ? " completed" : "");
    div.innerHTML = `
      <div class="task-meta">${new Date(task.createdAt.toDate()).toLocaleDateString()}</div>
      <div>${task.text}</div>
      <div class="task-buttons">
        <button class="btn complete-btn">${task.completed ? "✅" : "تم"}</button>
        <button class="btn delete-btn">حذف</button>
      </div>
    `;

    // أكشن زر تم
    div.querySelector(".complete-btn").addEventListener("click", async () => {
      await updateDoc(doc(db, "tasks", docSnap.id), { completed: !task.completed });
      loadTasks();
    });

    // أكشن زر حذف
    div.querySelector(".delete-btn").addEventListener("click", async () => {
      await deleteDoc(doc(db, "tasks", docSnap.id));
      loadTasks();
    });

    tasksList.appendChild(div);
  });
}

// === حذف الكل ===
clearBtn.addEventListener("click", async () => {
  const q = query(collection(db, "tasks"), where("uid", "==", currentUser.uid), where("category", "==", currentCategory));
  const snapshot = await getDocs(q);
  const promises = snapshot.docs.map(docSnap => deleteDoc(doc(db, "tasks", docSnap.id)));
  await Promise.all(promises);
  loadTasks();
});

// === تبويبات التصنيفات ===
document.querySelectorAll(".category-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".category-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentCategory = tab.getAttribute("data-cat");
    loadTasks();
  });
});

// === تغيير اللغة ===
langToggle.addEventListener("click", () => {
  language = language === "ar" ? "en" : "ar";
  updateTexts();
});

function updateTexts() {
  document.querySelector(".title").textContent = translations[language].title;
  taskInput.placeholder = translations[language].placeholder;
  addBtn.textContent = translations[language].add;
  clearBtn.textContent = translations[language].clear;
  loginBtn.textContent = translations[language].login;
  langToggle.textContent = language === "ar" ? "English" : "العربية";

  const tabs = document.querySelectorAll(".category-tab");
  tabs[0].querySelector("span").textContent = translations[language].daily;
  tabs[1].querySelector("span").textContent = translations[language].weekly;
  tabs[2].querySelector("span").textContent = translations[language].monthly;
  tabs[3].querySelector("span").textContent = translations[language].year;

  loadTasks();
}
