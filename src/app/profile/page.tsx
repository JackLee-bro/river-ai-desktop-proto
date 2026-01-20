"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  name: string;
  team: string;
  email: string;
  phone: string;
};

const defaultProfile: Profile = {
  name: "홍길동",
  team: "수문조사팀",
  email: "riverai@naver.com",
  phone: "010-1111-2222",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(defaultProfile);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [logoutStatus, setLogoutStatus] = useState<
    "idle" | "showing" | "done"
  >("idle");
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("demo-auth");
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as { email?: string };
      setProfile((prev) => ({ ...prev, email: parsed.email ?? prev.email }));
    } catch {
      setProfile(defaultProfile);
    }
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem("demo-auth");
    setLogoutStatus("showing");
    setTimeout(() => {
      setLogoutStatus("done");
      router.push("/");
    }, 500);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            내 정보
          </h1>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-3xl text-slate-400">
              👤
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {profile.name}
            </p>
            <p className="text-sm text-slate-500">{profile.team}</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold text-slate-500">
              이름
              <input
                type="text"
                value={profile.name}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              소속
              <input
                type="text"
                value={profile.team}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    team: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              메일
              <input
                type="email"
                value={profile.email}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              전화번호
              <input
                type="text"
                value={profile.phone}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
              />
            </label>
            <div className="flex flex-col items-center gap-3">
              <button
                type="submit"
                className="w-full max-w-[200px] rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                수정
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full max-w-[200px] rounded-full border border-rose-200 px-5 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
              >
                로그아웃
              </button>
              {status === "saved" && (
                <span className="text-xs font-semibold text-emerald-600">
                  저장되었습니다.
                </span>
              )}
            </div>
          </form>
        </section>
      </div>
      {logoutStatus === "showing" && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          로그아웃되었습니다.
        </div>
      )}
    </main>
  );
}
