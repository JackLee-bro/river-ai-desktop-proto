export type Station = {
  id: string;
  name: string;
  address: string;
  river: string;
  manager: string;
  phone: string;
  status: "정상" | "점검" | "통신 이상";
  updatedAt: string;
  coords: [number, number];
  images: { id: string; label: string; url?: string }[];
};

export const stations: Station[] = [
  {
    id: "gimhae-jeongcheon",
    name: "김해시 정천교",
    address: "경상남도 김해시 불암동 533",
    river: "낙동강",
    manager: "김해 지점",
    phone: "055-310-2200",
    status: "정상",
    updatedAt: "2025-03-20 11:30",
    coords: [35.2432, 128.9118],
    images: [
      {
        id: "jeongcheon-01",
        label: "관측소 전경",
        url: "/stations/gimhae-jeongcheon/image01.png",
      },
      {
        id: "jeongcheon-02",
        label: "수위계",
        url: "/stations/gimhae-jeongcheon/image02.png",
      },
      {
        id: "jeongcheon-03",
        label: "교량 하부",
        url: "/stations/gimhae-jeongcheon/image03.png",
      },
      {
        id: "jeongcheon-04",
        label: "센서 부착부",
        url: "/stations/gimhae-jeongcheon/image04.png",
      },
      {
        id: "jeongcheon-05",
        label: "수문 시설",
        url: "/stations/gimhae-jeongcheon/image05.png",
      },
      {
        id: "jeongcheon-06",
        label: "제어 패널",
        url: "/stations/gimhae-jeongcheon/image06.png",
      },
    ],
  },
  {
    id: "haeundae-01",
    name: "해운대 관측소",
    address: "부산광역시 해운대구 우동 1418",
    river: "수영강",
    manager: "해운대 지점",
    phone: "051-410-2024",
    status: "정상",
    updatedAt: "2025-03-20 10:12",
    coords: [35.1631, 129.1635],
    images: [
      { id: "overview", label: "관측소 전경" },
      { id: "water-gauge", label: "수위계" },
      { id: "bridge", label: "하천 시설" },
      { id: "intake", label: "취수부" },
      { id: "camera", label: "CCTV" },
      { id: "control", label: "제어 패널" },
    ],
  },
  {
    id: "suyeong-02",
    name: "수영 관측소",
    address: "부산광역시 수영구 민락동 110",
    river: "수영강",
    manager: "수영 지점",
    phone: "051-210-4221",
    status: "정상",
    updatedAt: "2025-03-20 09:45",
    coords: [35.1534, 129.1193],
    images: [
      { id: "overview", label: "관측소 전경" },
      { id: "water-gauge", label: "수위계" },
      { id: "pump", label: "펌프 설비" },
      { id: "sensor", label: "센서 부착부" },
      { id: "bridge", label: "교량 하부" },
      { id: "control", label: "제어 패널" },
    ],
  },
  {
    id: "sasang-03",
    name: "사상 관측소",
    address: "부산광역시 사상구 감전동 132",
    river: "낙동강",
    manager: "사상 지점",
    phone: "051-410-7440",
    status: "점검",
    updatedAt: "2025-03-19 18:10",
    coords: [35.1627, 128.9823],
    images: [
      { id: "overview", label: "관측소 전경" },
      { id: "water-gauge", label: "수위계" },
      { id: "bridge", label: "교량 하부" },
      { id: "solar", label: "태양광 패널" },
      { id: "intake", label: "취수부" },
      { id: "control", label: "제어 패널" },
    ],
  },
  {
    id: "gangseo-04",
    name: "강서 관측소",
    address: "부산광역시 강서구 대저1동 1405",
    river: "낙동강",
    manager: "강서 지점",
    phone: "051-230-1155",
    status: "정상",
    updatedAt: "2025-03-20 08:30",
    coords: [35.2093, 128.9719],
    images: [
      { id: "overview", label: "관측소 전경" },
      { id: "water-gauge", label: "수위계" },
      { id: "bridge", label: "교량 하부" },
      { id: "sensor", label: "센서 부착부" },
      { id: "pump", label: "펌프 설비" },
      { id: "control", label: "제어 패널" },
    ],
  },
  {
    id: "gijang-05",
    name: "기장 관측소",
    address: "부산광역시 기장군 기장읍 동부리 132",
    river: "일광천",
    manager: "기장 지점",
    phone: "051-981-1820",
    status: "통신 이상",
    updatedAt: "2025-03-19 23:05",
    coords: [35.2444, 129.2226],
    images: [
      { id: "overview", label: "관측소 전경" },
      { id: "water-gauge", label: "수위계" },
      { id: "camera", label: "CCTV" },
      { id: "sensor", label: "센서 부착부" },
      { id: "bridge", label: "교량 하부" },
      { id: "control", label: "제어 패널" },
    ],
  },
  {
    id: "namgu-06",
    name: "남구 관측소",
    address: "부산광역시 남구 대연동 175",
    river: "수영강",
    manager: "남구 지점",
    phone: "051-440-7720",
    status: "정상",
    updatedAt: "2025-03-20 11:02",
    coords: [35.1365, 129.0829],
    images: [
      { id: "overview", label: "관측소 전경" },
      { id: "water-gauge", label: "수위계" },
      { id: "sensor", label: "센서 부착부" },
      { id: "solar", label: "태양광 패널" },
      { id: "bridge", label: "교량 하부" },
      { id: "control", label: "제어 패널" },
    ],
  },
];
