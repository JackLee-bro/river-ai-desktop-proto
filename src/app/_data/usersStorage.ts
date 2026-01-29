export type AdminUser = {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  team?: string;
  department?: string;
  password?: string;
  role: "관리자" | "일반";
  status: "승인대기" | "활성" | "정지" | "거절";
};

const STORAGE_KEY = "demo-users";
const USERS_UPDATED_EVENT = "users-updated";

export const defaultUsers: AdminUser[] = [
  {
    id: "user-0",
    userId: "river",
    name: "리버",
    role: "일반",
    status: "활성",
    password: "12qw",
  },
  {
    id: "user-1",
    userId: "riverai",
    name: "리버",
    role: "관리자",
    status: "활성",
  },
  {
    id: "user-2",
    userId: "minsukim",
    name: "김민수",
    role: "관리자",
    status: "활성",
  },
  {
    id: "user-3",
    userId: "seoyeonlee",
    name: "이서연",
    role: "일반",
    status: "활성",
  },
  {
    id: "user-4",
    userId: "jihopark",
    name: "박지호",
    role: "일반",
    status: "활성",
  },
  {
    id: "user-5",
    userId: "areumchoi",
    name: "최아름",
    role: "일반",
    status: "활성",
  },
  {
    id: "user-6",
    userId: "seokjunhan",
    name: "한석준",
    role: "일반",
    status: "활성",
  },
  {
    id: "user-7",
    userId: "yunhakim",
    name: "윤하",
    role: "일반",
    status: "활성",
  },
  {
    id: "user-8",
    userId: "miraesong",
    name: "송미래",
    role: "관리자",
    status: "활성",
  },
  {
    id: "user-9",
    userId: "hojunseo",
    name: "서호준",
    role: "일반",
    status: "활성",
  },
  {
    id: "user-10",
    userId: "jinwoopark",
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
    const parsed = JSON.parse(stored) as (AdminUser & { userid?: string })[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((user) => ({
      ...user,
      userId: user.userId ?? user.userid ?? "",
    }));
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
