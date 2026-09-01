"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/firebase";

export default function FirebaseProvider() {
  useEffect(() => {
    initAnalytics().catch(console.error);
  }, []);

  return null;
}
