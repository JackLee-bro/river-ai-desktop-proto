export type AdminUser = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  team?: string;
  department?: string;
  password?: string;
  role: "관리자" | "일반";
  status: "활성" | "정지";
};

const STORAGE_KEY = "demo-users";
const USERS_UPDATED_EVENT = "users-updated";

export const defaultUsers: AdminUser[] = [
  {
    id: "user-0",
    email: "river@naver.com",
    name: "리버",
    role: "일반",
    status: "활성",
    password: "12qw",
  },
  {
    id: "user-1",
    email: "riverai@naver.com",
    name: "리버",
    role: "관리자",
    status: "활성",
  },
  {
    id: "user-2",
    email: "minsukim@sample.com",
    name: "김민수",
    role: "관리자",
    status: "활성",
  },
  {
    id: "user-3",
    email: "seoyeon.lee@sample.com",
    name: "이서연",
    role: "일반",
    status: "활성",
  },
  {
    id: "user-4",
    email: "jiho.park@sample.com",
    name: "박지호",
    role: "일반",
    status: "활성",
  },
  {
    id: "user-5",
    email: "areum.choi@sample.com",
    name: "최아름",
    role: "일반",
    status: "활성",
  },
  {
    id: "user-6",
    email: "seokjun.han@sample.com",
    name: "한석준",
    role: "일반",
    status: "활성",
  },
  {
    id: "user-7",
    email: "yunha.kim@sample.com",
    name: "윤하",
    role: "일반",
    status: "활성",
  },
  {
    id: "user-8",
    email: "mirae.song@sample.com",
    name: "송미래",
    role: "관리자",
    status: "활성",
  },
  {
    id: "user-9",
    email: "hojun.seo@sample.com",
    name: "서호준",
    role: "일반",
    status: "활성",
  },
  {
    id: "user-10",
    email: "jinwoo.park@sample.com",
    name: "진우",
    role: "일반",
    status: "정지",
  },
];

export const readStoredUsers = (): AdminUser[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as AdminUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeStoredUsers = (users: AdminUser[]): void => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event(USERS_UPDATED_EVENT));
};
