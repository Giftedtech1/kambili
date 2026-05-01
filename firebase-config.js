// Firebase Configuration — CDN version (matches script.js & kambili-control-px99.js)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsBVDYuojKS_3i62hhRzYJLHOG5NZeFzU",
  authDomain: "kambili-a5484.firebaseapp.com",
  projectId: "kambili-a5484",
  storageBucket: "kambili-a5484.firebasestorage.app",
  messagingSenderId: "880685593495",
  appId: "1:880685593495:web:021fd4dd39697b5042cad2",
  measurementId: "G-VLY3DTEC3M"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
