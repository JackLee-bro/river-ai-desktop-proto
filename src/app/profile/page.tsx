"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  defaultUsers,
  readStoredUsers,
  writeStoredUsers,
} from "../_data/usersStorage";

type Profile = {
  name: string;
  team: string;
  department: string;
  email: string;
  phone: string;
};

const defaultProfile: Profile = {
  name: "홍길동",
  team: "수문조사팀",
  department: "운영",
  email: "riverai@naver.com",
  phone: "010-1111-2222",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(defaultProfile);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [isEditing, setIsEditing] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [logoutStatus, setLogoutStatus] = useState<
    "idle" | "showing" | "done"
  >("idle");
  const router = useRouter();

  const loadProfile = () => {
    const stored = localStorage.getItem("demo-auth");
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { email?: string };
      const email = parsed.email ?? defaultProfile.email;
      const storedUsers = readStoredUsers();
      const matched = storedUsers.find(
        (user) => user.email.toLowerCase() === email.toLowerCase(),
      );
      setProfile((prev) => ({
        ...prev,
        email,
        name: matched?.name ?? prev.name,
        team: matched?.team ?? prev.team,
        department: matched?.department ?? prev.department,
        phone: matched?.phone ?? prev.phone,
      }));
    } catch {
      setProfile(defaultProfile);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfile = () => {
    const storedUsers = readStoredUsers();
    const baseUsers =
      storedUsers.length > 0 ? storedUsers : defaultUsers;
    const nextUsers = baseUsers.map((user) =>
      user.email.toLowerCase() === profile.email.toLowerCase()
        ? {
          ...user,
          name: profile.name,
          team: profile.team,
          department: profile.department,
          phone: profile.phone,
        }
        : user,
    );
    if (
      !nextUsers.some(
        (user) =>
          user.email.toLowerCase() === profile.email.toLowerCase(),
      )
    ) {
      nextUsers.unshift({
        id: `user-${Date.now()}`,
        email: profile.email,
        name: profile.name,
        team: profile.team,
        department: profile.department,
        phone: profile.phone,
        role: "일반",
        status: "활성",
      });
    }
    writeStoredUsers(nextUsers);
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
    setIsEditing(false);
  };

  const handleProfileSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!isEditing) {
      return;
    }
    saveProfile();
  };

  const handlePasswordChange = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSaved(false);

    if (!currentPassword || !nextPassword || !confirmPassword) {
      setPasswordError("모든 비밀번호 항목을 입력해주세요.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      setPasswordError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    const storedUsers = readStoredUsers();
    const baseUsers =
      storedUsers.length > 0 ? storedUsers : defaultUsers;
    const matched = baseUsers.find(
      (user) =>
        user.email.toLowerCase() === profile.email.toLowerCase(),
    );
    if (!matched || matched.password !== currentPassword) {
      setPasswordError("현재 비밀번호가 올바르지 않습니다.");
      return;
    }
    const nextUsers = baseUsers.map((user) =>
      user.email.toLowerCase() === profile.email.toLowerCase()
        ? { ...user, password: nextPassword }
        : user,
    );
    writeStoredUsers(nextUsers);
    setPasswordSaved(true);
    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");
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
          <h1 className="text-3xl font-semibold text-slate-900">
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

          <form className="mt-6 space-y-4" onSubmit={handleProfileSubmit}>
            <label className="block text-xs font-semibold text-slate-500">
              이름
              <input
                type="text"
                value={profile.name}
                disabled={!isEditing}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:bg-slate-100"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              소속
              <input
                type="text"
                value={profile.team}
                disabled={!isEditing}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    team: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:bg-slate-100"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              부서
              <input
                type="text"
                value={profile.department}
                disabled={!isEditing}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    department: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:bg-slate-100"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              메일
              <input
                type="email"
                value={profile.email}
                disabled={!isEditing}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:bg-slate-100"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              전화번호
              <input
                type="text"
                value={profile.phone}
                disabled={!isEditing}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:bg-slate-100"
              />
            </label>
            <div className="flex flex-col items-center gap-3">
              {isEditing ? (
                <button
                  type="button"
                  onClick={saveProfile}
                  className="w-full max-w-[200px] rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  저장
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setPasswordError("");
                    setPasswordSaved(false);
                    setStatus("idle");
                  }}
                  className="w-full max-w-[200px] rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  수정
                </button>
              )}
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    loadProfile();
                    setIsEditing(false);
                    setPasswordError("");
                    setPasswordSaved(false);
                    setCurrentPassword("");
                    setNextPassword("");
                    setConfirmPassword("");
                  }}
                  className="w-full max-w-[200px] rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
                >
                  취소
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full max-w-[200px] rounded-full border border-rose-200 px-5 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
              >
                로그아웃
              </button>
              {status === "saved" && !isEditing && (
                <span className="text-xs font-semibold text-emerald-600">
                  저장되었습니다.
                </span>
              )}
            </div>
          </form>
          {isEditing ? (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="text-base font-semibold text-slate-900">
                비밀번호 변경
              </h2>
              <form
                className="mt-4 space-y-4"
                onSubmit={handlePasswordChange}
              >
                <label className="block text-xs font-semibold text-slate-500">
                  현재 비밀번호
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-500">
                  새 비밀번호
                  <input
                    type="password"
                    value={nextPassword}
                    onChange={(event) =>
                      setNextPassword(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-500">
                  새 비밀번호 확인
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  />
                </label>
                {passwordError ? (
                  <p className="text-xs font-semibold text-rose-600">
                    {passwordError}
                  </p>
                ) : null}
                {passwordSaved ? (
                  <p className="text-xs font-semibold text-emerald-600">
                    비밀번호가 변경되었습니다.
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="w-full rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  비밀번호 변경
                </button>
              </form>
            </div>
          ) : null}
        </section>
      </div>
      {logoutStatus === "showing" && (
        <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          로그아웃되었습니다.
        </div>
      )}
    </main>
  );
}
