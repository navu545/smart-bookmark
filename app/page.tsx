"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at: string;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);


  useEffect(() => {
    // Fetch the current authenticated user on initial load
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (!data.user) setBookmarks([]);
    });

    // Listen for future auth changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) setBookmarks([]);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchBookmarks = async () => {
      // RLS ensures only the current user's bookmarks are returned
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      setBookmarks(data ?? []);
    };

    fetchBookmarks();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchBookmarks = async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      setBookmarks(data ?? []);
    };
    // Subscribe to realtime changes for this user's bookmarks
    const channel = supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBookmarks();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);



  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <button
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${location.origin}/auth/callback`,
              },
            })
          }
          className="rounded bg-black px-4 py-2 text-white"
        >
          Sign in with Google
        </button>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Welcome, {user.email}</h1>
      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-2 text-sm text-blue-600 underline"
      >
        Logout
      </button>
      <form
        className="mt-4 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const title = (form.elements.namedItem("title") as HTMLInputElement)
            .value;
          const url = (form.elements.namedItem("url") as HTMLInputElement)
            .value;
          
          if (!title.trim() || !url.trim()) return;

          const { error } = await supabase.from("bookmarks").insert({
            title,
            url,
            user_id: user.id,
          });

          if (error) {
            console.error(error.message);
          } 

          form.reset();
        }}
      >
        <input
          name="title"
          placeholder="Title"
          className="border px-2 py-1"
          required
        />
        <input
          name="url"
          placeholder="https://example.com"
          className="border px-2 py-1"
          required
        />
        <button className="bg-black px-3 py-1 text-white">Add</button>
      </form>

      <ul className="mt-4 space-y-2">
        {bookmarks.map((b) => (
          <li key={b.id} className="flex justify-between border p-2">
            <a
              href={b.url}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {b.title}
            </a>
            <button
              onClick={async () => {
                await supabase.from("bookmarks").delete().eq("id", b.id);
              }}
              className="text-red-500"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
