"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAqhHJGJyykiKSU-IgIa321Rm0zN97d9rE",
  authDomain: "psychology-5d4e1.firebaseapp.com",
  projectId: "psychology-5d4e1",
  storageBucket: "psychology-5d4e1.firebasestorage.app",
  messagingSenderId: "883810074062",
  appId: "1:883810074062:web:6d691817fa94cb94beff9f",
  measurementId: "G-MHTHP5PE9W"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const initAnalytics = async () => {
  if (typeof window !== "undefined" && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};
