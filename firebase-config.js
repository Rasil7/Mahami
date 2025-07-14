import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

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
export { db };

