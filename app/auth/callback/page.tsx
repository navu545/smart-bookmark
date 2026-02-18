"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // This page exists only to let Supabase finalize the auth session
    // after OAuth redirect, then navigate the user back to the app.
    supabase.auth.getSession().then(() => {
      router.push("/");
    });
  }, []);

  return <p className="p-4">Signing you in...</p>;
}
