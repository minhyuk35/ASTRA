"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { mesh, feature } from 'topojson-client';
import land50 from 'world-atlas/land-50m.json';
import { AnimatePresence, motion } from "framer-motion";

// ─── Planet config ────────────────────────────────────────────────────
// w/h = sprite world-unit dimensions (width × height).
// Saturn is wider than tall because the ring image extends horizontally.
const PLANETS = [
  { id: 1, name: "출석 & 포인트", type: "Daily Activity",    file: "mercury", w: 1.3, h: 1.3, x: 1.0,  bobAmp: 0.10, bobSpeed: 1.20, phase: 0.0 },
  { id: 2, name: "MONEYLAB",     type: "Economy",            file: "venus",   w: 1.8, h: 1.8, x: 4.0,  bobAmp: 0.14, bobSpeed: 0.90, phase: 1.4 },
  { id: 3, name: "커뮤니티",      type: "Community",          file: "earth",   w: 2.0, h: 2.0, x: 7.2,  bobAmp: 0.14, bobSpeed: 1.00, phase: 2.2 },
  { id: 4, name: "길드 시스템",   type: "Guild",              file: "mars",    w: 1.5, h: 1.5, x: 10.4, bobAmp: 0.11, bobSpeed: 0.80, phase: 0.8 },
  { id: 5, name: "ASTRA BOT",   type: "Discord Bot",        file: "jupiter", w: 3.6, h: 3.6, x: 15.0, bobAmp: 0.18, bobSpeed: 0.70, phase: 3.2 },
  { id: 6, name: "이벤트 & 공지", type: "Events",             file: "saturn",  w: 5.0, h: 3.75, x: 20.5, bobAmp: 0.16, bobSpeed: 0.60, phase: 1.9 },
  { id: 7, name: "프로필",        type: "Profile & Links",   file: "uranus",  w: 2.4, h: 2.4, x: 25.5, bobAmp: 0.13, bobSpeed: 0.52, phase: 4.1 },
  { id: 8, name: "포트폴리오",    type: "Portfolio",          file: "neptune", w: 2.2, h: 2.2, x: 29.5, bobAmp: 0.12, bobSpeed: 0.44, phase: 2.7 },
] as const;

type PlanetDatum = typeof PLANETS[number];

type PlanetProjectDetail = {
  title:  string;
  year:   string;
  role:   string;
  stack:  string;
  status: string;
  desc:   string;
};

const PLANET_DETAILS: Record<number, PlanetProjectDetail> = {
  1: {
    title:  "출석 & 포인트",
    year:   "2025 → 현재",
    role:   "Daily Activity System",
    stack:  "일일 출석, 연속 보너스, 포인트 상점, 활동 보상",
    status: "작동 중",
    desc:   "매일 출석 체크로 포인트를 쌓고, 연속 출석 시 추가 보너스를 획득하세요. 사이트 활동(게시글 +5pt, 댓글 +2pt)으로도 포인트를 얻을 수 있어요. 쌓인 포인트는 길드 창설, 아이템 구매, 우주 편지에 사용됩니다.",
  },
  2: {
    title:  "MONEYLAB",
    year:   "2025 → 현재",
    role:   "Community Economy",
    stack:  "SGC 코인 거래, Discord 포인트 전환, 활동 보상",
    status: "작동 중",
    desc:   "ASTRA의 경제 시스템입니다. Discord 포인트를 ASTRA 포인트로 전환(1,000 : 10)하고, 가상 SGC 코인 시장에 참여해보세요. 포인트는 길드 창설, 아이템 구매, 우주 편지 등 다양한 활동에 사용됩니다.",
  },
  3: {
    title:  "커뮤니티",
    year:   "2025 → 현재",
    role:   "Social Hub",
    stack:  "자유 게시판, Q&A, 리뷰, 우주 편지, 공지사항",
    status: "작동 중",
    desc:   "ASTRA 멤버들이 소통하는 공간입니다. 자유 게시판에서 이야기를 나누고, 익명 우주 편지로 우주에 흔적을 남겨보세요. 게시글 작성 시 +5pt, 댓글 작성 시 +2pt가 지급됩니다.",
  },
  4: {
    title:  "길드 시스템",
    year:   "2025 → 현재",
    role:   "Guild System",
    stack:  "길드 창설, 가입 & 초대, 포인트 기부, 레벨 업, 길드 채팅",
    status: "작동 중",
    desc:   "마음이 맞는 사람들과 길드를 만들고 함께 성장하세요. 포인트 1,000을 사용해 길드를 창설하고, 멤버들의 기부로 XP를 쌓아 레벨을 올릴 수 있습니다.",
  },
  5: {
    title:  "ASTRA BOT",
    year:   "2025 → 현재",
    role:   "Discord Bot",
    stack:  "레벨, 출석, 미니게임, 포인트, 랭킹, 티켓, 온보딩",
    status: "작동 중",
    desc:   "ASTRA 서버를 운영하는 Discord 봇입니다. 출석 체크, 레벨 시스템, 미니게임, 포인트 상점, 관리 도구까지 서버 생활 전반을 지원합니다.",
  },
  6: {
    title:  "이벤트 & 공지",
    year:   "2025 → 현재",
    role:   "Events & Announcements",
    stack:  "공지, 이벤트, 업데이트, Discord 웹훅 알림",
    status: "작동 중",
    desc:   "ASTRA의 모든 소식이 모이는 곳입니다. 새로운 공지와 이벤트를 확인하고, 업데이트 내역을 살펴보세요. 중요한 소식은 Discord로도 즉시 전송됩니다.",
  },
  7: {
    title:  "프로필 & 연결",
    year:   "2025 → 현재",
    role:   "Profile & Connections",
    stack:  "닉네임, 핸들, 아바타, 배너, Roblox 연동",
    status: "작동 중",
    desc:   "나만의 ASTRA 프로필을 꾸며보세요. 닉네임 최초 설정 무료, 변경 시 50pt 소모. 아바타 컬러와 배너를 커스텀하고 Roblox 계정도 연동할 수 있습니다.",
  },
  8: {
    title:  "포트폴리오",
    year:   "2024 → 현재",
    role:   "Personal Projects",
    stack:  "Next.js · React · TypeScript · Python · AI · Vercel",
    status: "작동 중",
    desc:   "직접 개발한 개인 프로젝트 모음입니다. AI 기반 PDF 분석 도구, 공부 타이머, 포트폴리오 사이트, 기업 웹사이트, Discord 봇 등 다양한 프로젝트를 만들었어요.",
  },
};

const getPlanetDetail = (planet: PlanetDatum): PlanetProjectDetail =>
  PLANET_DETAILS[planet.id] ?? {
    title: planet.name, year: "2025 → 현재", role: planet.type,
    stack: "—", status: "준비 중", desc: "준비 중인 기능입니다.",
  };

// ─── Per-planet project nodes ─────────────────────────────────────────
type ProjectNode = {
  id:    number;
  title: string;
  role:  string;
  year:  string;
  stack: string;
  desc:  string;
  url:   string;
  angle: number; // degrees; 0=right, 90=up, 180=left, 270=down
};

const PROJECT_NODE_ANGLES = [42, 162, 282] as const;

const makeNodes = (
  nodes: Omit<ProjectNode, "id" | "angle">[],
): ProjectNode[] => nodes.map((node, index) => ({
  ...node,
  id: index + 1,
  angle: PROJECT_NODE_ANGLES[index] ?? 42,
}));

const PLANET_NODES: Partial<Record<number, ProjectNode[]>> = {
  1: makeNodes([
    {
      title: "매일 출석",
      role:  "Daily Check-in",
      year:  "매일 갱신",
      stack: "+10 pts / 일 · Discord /출석 연동",
      desc:  "사이트 접속 또는 Discord에서 /출석 명령어로 하루 10포인트를 적립하세요. 포인트는 당일 한 번만 지급되며, 자정 기준으로 초기화됩니다.",
      url:   "/moneylab",
    },
    {
      title: "연속 보너스",
      role:  "Streak Reward",
      year:  "Discord 봇 연동",
      stack: "7일 +70pts · 30일 +300pts",
      desc:  "하루도 빠짐없이 출석하면 연속 보너스가 지급됩니다. 7일, 30일 연속 출석 시 더 큰 보상을 받을 수 있어요. Discord 봇에서 /출석연속 으로 현재 스트릭을 확인하세요.",
      url:   "/moneylab",
    },
    {
      title: "포인트 상점",
      role:  "Point Shop",
      year:  "아이템 준비 중",
      stack: "배경 · 뱃지 · 이모티콘",
      desc:  "모은 포인트로 프로필 꾸미기 아이템, 뱃지, 이모티콘 등을 구매할 수 있습니다. 새로운 아이템이 계속 추가될 예정이에요.",
      url:   "/moneylab/shop",
    },
  ]),
  2: makeNodes([
    {
      title: "SGC 코인",
      role:  "Coin Market",
      year:  "실시간 갱신",
      stack: "가상 시세 · 등락률 차트",
      desc:  "ASTRA 서버 내 가상 통화 SGC 코인의 시세를 확인하세요. 실시간으로 변동되는 가격과 등락률을 MoneyLab에서 모니터링할 수 있습니다.",
      url:   "/moneylab",
    },
    {
      title: "포인트 전환",
      role:  "Conversion",
      year:  "100 : 1 교환",
      stack: "Discord 1,000pt → ASTRA 10pt",
      desc:  "Discord 봇에서 쌓은 포인트를 사이트 포인트로 전환하세요. 1,000 Discord 포인트당 10 ASTRA 포인트를 받을 수 있습니다. MoneyLab SGC HOLDING 영역에서 전환 가능해요.",
      url:   "/moneylab",
    },
    {
      title: "활동 보상",
      role:  "Activity Rewards",
      year:  "즉시 지급",
      stack: "게시글 +5pt · 댓글 +2pt · 출석 +10pt · 우주편지 -30pt",
      desc:  "사이트 내 다양한 활동으로 포인트를 획득하세요. 게시글 작성 시 +5pt, 댓글 작성 시 +2pt가 즉시 지급됩니다. 우주 편지는 30pt가 소모되는 특별 활동이에요.",
      url:   "/moneylab",
    },
  ]),
  3: makeNodes([
    {
      title: "게시판",
      role:  "Community Board",
      year:  "자유 · Q&A · 리뷰",
      stack: "게시글 +5pt · 댓글 +2pt",
      desc:  "자유롭게 글을 쓰고 소통하는 커뮤니티 게시판입니다. 자유글, 질문, 리뷰 카테고리로 분류되어 있으며, 게시글 작성 시 +5pt, 댓글 작성 시 +2pt가 지급됩니다.",
      url:   "/board",
    },
    {
      title: "COSMOS",
      role:  "Space Notes",
      year:  "익명 · 30pt 소모",
      stack: "익명 메시지 · 150자 제한 · 우주 부유",
      desc:  "우주 공간에 익명 메시지를 띄워보세요. 30포인트를 사용해 편지를 남기고, 광활한 우주를 스크롤하며 다른 사람들의 흔적을 발견하는 공간입니다.",
      url:   "/cosmos",
    },
    {
      title: "공지사항",
      role:  "Announcements",
      year:  "수시 업데이트",
      stack: "NOTICE · EVENT · UPDATE",
      desc:  "ASTRA 서버의 공지, 이벤트, 업데이트 소식을 확인하세요. 중요한 소식은 Discord 채널로도 즉시 알림이 전송됩니다.",
      url:   "/announcements",
    },
  ]),
  4: makeNodes([
    {
      title: "길드 창설",
      role:  "Guild Creation",
      year:  "1,000pts 필요",
      stack: "이름 · 슬러그 · 설명 · 배너",
      desc:  "사이트 포인트 1,000을 사용해 나만의 길드를 창설하세요. 길드장이 되어 멤버를 모집하고, 초대와 가입 신청 시스템으로 팀을 구성할 수 있습니다.",
      url:   "/guilds/create",
    },
    {
      title: "길드 레벨",
      role:  "Guild Leaderboard",
      year:  "레벨 1 → MAX",
      stack: "포인트 기부 · XP · 랭킹",
      desc:  "멤버들의 포인트 기부로 길드 XP가 쌓이고 레벨이 오릅니다. 전체 길드 랭킹에서 우리 길드의 위치를 확인하고, 최강 길드를 향해 함께 성장하세요.",
      url:   "/guilds",
    },
    {
      title: "길드 채팅",
      role:  "Guild Chat",
      year:  "멤버 전용",
      stack: "실시간 채팅 · 400자 제한",
      desc:  "길드 멤버끼리만 접근할 수 있는 전용 채팅 공간입니다. 실시간으로 대화하며 팀 활동을 이어나가세요. 비멤버에게는 완전히 비공개입니다.",
      url:   "/guilds",
    },
  ]),
  5: makeNodes([
    {
      title: "레벨 시스템",
      role:  "XP & Levels",
      year:  "채팅 활동 기반",
      stack: "/레벨 · /랭킹 · 레벨업 알림",
      desc:  "Discord에서 채팅할수록 XP가 쌓이고 레벨이 오릅니다. /랭킹 명령어로 서버 내 순위를 확인하고, 레벨업 시 자동 알림과 함께 칭호가 부여됩니다.",
      url:   "https://discord.gg/yMmPhn79Yp",
    },
    {
      title: "미니게임",
      role:  "Mini Games",
      year:  "Discord 포인트 사용",
      stack: "잭팟 · 룰렛 · 키노",
      desc:  "Discord 봇의 미니게임으로 포인트를 걸고 더 많은 보상을 노려보세요. 잭팟, 룰렛, 키노 3종의 게임이 준비되어 있습니다. 행운이 따른다면 한 번에 큰 포인트를 얻을 수 있어요.",
      url:   "https://discord.gg/yMmPhn79Yp",
    },
    {
      title: "봇 명령어",
      role:  "Bot Commands",
      year:  "Slash & Prefix",
      stack: "/출석 · /포인트 · /티켓 · /랭킹",
      desc:  "/티켓으로 관리자에게 문의하고, 온보딩 시스템으로 새 멤버를 환영하세요. 관리자는 명령어로 포인트 지급·차감, 닉네임 관리, 서버 운영을 자동화할 수 있습니다.",
      url:   "https://discord.gg/yMmPhn79Yp",
    },
  ]),
  6: makeNodes([
    {
      title: "공지사항",
      role:  "Official Notices",
      year:  "수시 게시",
      stack: "운영팀 공지 · Discord 웹훅",
      desc:  "ASTRA 운영팀의 공식 공지사항을 확인하세요. 서버 정책 변경, 중요 안내사항이 이곳에 게시되며, Discord 채널로도 즉시 전송됩니다.",
      url:   "/announcements",
    },
    {
      title: "이벤트",
      role:  "Server Events",
      year:  "시즌 한정",
      stack: "기간 이벤트 · 한정 보상 · 참여 조건",
      desc:  "시즌별 이벤트에 참여하고 한정 보상을 받아가세요. 이벤트 기간과 조건은 공지사항에서 확인할 수 있으며, Discord 알림으로 놓치지 마세요.",
      url:   "/announcements",
    },
    {
      title: "업데이트",
      role:  "Patch Notes",
      year:  "기능 추가 · 수정",
      stack: "사이트 업데이트 · 봇 업데이트",
      desc:  "ASTRA 플랫폼과 Discord 봇의 최신 업데이트 내역을 확인하세요. 새로 추가된 기능과 개선사항, 버그 수정 내역을 확인할 수 있습니다.",
      url:   "/announcements",
    },
  ]),
  7: makeNodes([
    {
      title: "프로필 꾸미기",
      role:  "Customization",
      year:  "닉네임 변경 50pts",
      stack: "닉네임 · 핸들 · 아바타 · 배너 색상",
      desc:  "닉네임 최초 설정은 무료, 변경 시 50 포인트가 소모됩니다. 아바타 컬러와 배너 색상으로 나만의 개성을 표현하고, 자기소개도 작성해보세요.",
      url:   "/profile",
    },
    {
      title: "Roblox 연동",
      role:  "Roblox Link",
      year:  "계정 인증",
      stack: "Roblox 아이디 · 검증 배지",
      desc:  "ASTRA 프로필에 Roblox 계정을 연결하세요. 인증이 완료되면 프로필에 Roblox 아이디가 표시됩니다.",
      url:   "/profile",
    },
    {
      title: "메신저",
      role:  "Messenger",
      year:  "실시간 알림",
      stack: "길드 초대 · 공지 알림 · 쪽지",
      desc:  "다른 멤버로부터 받은 메시지, 길드 초대, 공지사항 알림을 메신저에서 확인하세요. 읽지 않은 메시지는 상단 네비게이션에 알림 배지로 표시됩니다.",
      url:   "/messenger",
    },
  ]),
  8: [
    { id: 1, title: "PDF Evidence AI", role: "AI 문서 분석",      year: "2024",         stack: "Next.js · OpenAI · PDF.js · Vercel",     desc: "PDF를 업로드하면 AI가 자동으로 문서를 분석하고 요약해줘요. 내용에 대한 질문을 하면 AI가 대답해주는 문서 기반 Q&A 시스템입니다.",                   url: "https://pp-pi-teal.vercel.app/",          angle: 36  },
    { id: 2, title: "Study Flow",      role: "학습 관리 도구",    year: "2024",         stack: "React · TypeScript · AI API · Vercel",   desc: "공부 타이머와 AI 질문 기능을 결합한 학습 보조 도구입니다. 집중 시간을 트래킹하고 학습 중 궁금한 점을 AI에게 바로 물어볼 수 있어요.",                 url: "https://study-ten-azure.vercel.app/",     angle: 108 },
    { id: 3, title: "Internet Drawer", role: "포트폴리오 사이트", year: "2024",         stack: "React · GSAP · Three.js · Vercel",       desc: "개인 포트폴리오 프로젝트를 모아둔 사이트입니다. GSAP를 활용한 고품질 애니메이션과 인터랙티브한 디자인으로 제작되었어요.",                           url: "https://my-study-ashen.vercel.app/",      angle: 180 },
    { id: 4, title: "SIGN Site",       role: "기업 웹사이트",     year: "2024",         stack: "Next.js · React · TailwindCSS · Vercel", desc: "SIGN 회사의 공식 웹사이트입니다. 현대적인 디자인과 최적화된 성능으로 기업 정보를 효과적으로 전달합니다.",                                         url: "https://www.sign-company.co.kr/",         angle: 252 },
    { id: 5, title: "Discord Bot",     role: "봇 개발",           year: "2024 → 현재", stack: "Python · discord.py · PostgreSQL",       desc: "ASTRA Discord 서버를 운영하는 커스텀 봇입니다. 레벨 시스템, 출석 체크, 미니게임, 포인트 경제, 관리 도구 등 다양한 기능을 제공해요.",               url: "https://discord.gg/yMmPhn79Yp",           angle: 324 },
  ],
};

const livePos = new Map<number, THREE.Vector3>();

// Per-planet hologram color themes
const PLANET_THEMES: Record<string, { dot: string; wire: string; ring: string; atmos: string; light: string; glow: string }> = {
  mercury: { dot: "#aaaaaa", wire: "#666666", ring: "#888888", atmos: "#101010", light: "#888888", glow: "#aaaaaa" },
  venus:   { dot: "#e8c060", wire: "#aa7722", ring: "#cc9933", atmos: "#281402", light: "#ddaa44", glow: "#ffdd88" },
  earth:   { dot: "#00ff99", wire: "#00aa55", ring: "#00cc66", atmos: "#041a0a", light: "#00cc77", glow: "#44ffaa" },
  mars:    { dot: "#ff6644", wire: "#aa2200", ring: "#cc3311", atmos: "#1a0402", light: "#ee4422", glow: "#ff8866" },
  jupiter: { dot: "#e8a055", wire: "#995522", ring: "#bb7733", atmos: "#1a0e04", light: "#cc8833", glow: "#ffcc77" },
  saturn:  { dot: "#e8cc66", wire: "#aa8822", ring: "#ccaa44", atmos: "#1a1404", light: "#ddbb44", glow: "#ffee88" },
  uranus:  { dot: "#55ddee", wire: "#118899", ring: "#33bbcc", atmos: "#041418", light: "#22aacc", glow: "#88eeff" },
  neptune: { dot: "#3399ff", wire: "#1144bb", ring: "#2266dd", atmos: "#020a18", light: "#1155cc", glow: "#66bbff" },
};
const SUN_POSITION = new THREE.Vector3(0, 0, 0);
const DEFAULT_CAM  = new THREE.Vector3(0, 17, 48);
const DEFAULT_LOOK = new THREE.Vector3(0, 0, 0);

// Sun sprite is scale=13 with the disc+corona covering ~85% of that → visual radius ≈ 5.5wu.
// Orbit radius must clear (sun visual radius + this planet's own half-size + margin),
// regardless of planet.x, so no planet sprite can ever dip inside the sun's disc.
const SUN_VISUAL_RADIUS = 5.5;
const ORBIT_CLEARANCE   = 1.5;

const getOrbitSpec = (planet: PlanetDatum) => {
  const planetHalf = Math.max(planet.w, planet.h) / 2;
  const minRadius  = SUN_VISUAL_RADIUS + planetHalf + ORBIT_CLEARANCE;
  const radius     = Math.max(minRadius, 9.5 + planet.x * 0.65);
  return {
    radius,
    zRadius: radius * (0.58 + planet.id * 0.026),
    speed: 0.118 / Math.sqrt(planet.id) + 0.012,
    phase: planet.phase + planet.id * 0.72,
  };
};

const setPlanetOrbitPosition = (planet: PlanetDatum, elapsed: number, target: THREE.Vector3) => {
  const orbit = getOrbitSpec(planet);
  const angle = orbit.phase + elapsed * orbit.speed;
  const y = Math.sin(elapsed * planet.bobSpeed + planet.phase) * planet.bobAmp;
  target.set(
    SUN_POSITION.x + Math.cos(angle) * orbit.radius,
    y,
    SUN_POSITION.z + Math.sin(angle) * orbit.zRadius,
  );
};

// ─── Warp Entry Effect ────────────────────────────────────────────────
function WarpCanvas({ onComplete }: { onComplete: () => void }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const doneRef      = useRef(false);
  const completeRef  = useRef(onComplete);
  // Keep ref current without restarting the animation on every render
  useEffect(() => { completeRef.current = onComplete; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxDist = Math.hypot(cx, cy) * 1.4;

    // Streaking warp stars (white/silver tones)
    const warpStars = Array.from({ length: 260 }, () => ({
      angle:      Math.random() * Math.PI * 2,
      dist:       Math.random() * 35 + 6,
      speed:      Math.random() * 1.8 + 0.5,
      bright:     Math.random() * 0.45 + 0.55,
      sz:         Math.random() * 0.5 + 0.25,
    }));
    // Static background star field (fades as warp accelerates)
    const bgField = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 0.7 + 0.1,
      a: Math.random() * 0.35 + 0.08,
    }));

    let startTime: number | null = null;
    let raf: number;

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed  = (ts - startTime) / 1000;
      const progress = Math.min(elapsed / 1.55, 1);
      const ease     = progress * progress;           // slow start, fast finish
      const warp     = 1 + ease * 26;

      // Trail overlay — darker, no blue tint
      ctx.fillStyle = `rgba(2, 2, 6, ${0.16 + ease * 0.28})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Static stars fade out as warp kicks in
      const bgAlpha = Math.max(0, 1 - progress / 0.55) * 0.32;
      if (bgAlpha > 0) {
        for (const s of bgField) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(215, 218, 225, ${s.a * bgAlpha})`;
          ctx.fill();
        }
      }

      // Subtle nebula core glow
      const glowR = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180 + ease * 120);
      glowR.addColorStop(0, `rgba(190, 200, 215, ${ease * 0.10})`);
      glowR.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.fillStyle = glowR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Warp streaks — white/silver, no blue
      for (const s of warpStars) {
        s.dist += s.speed * warp;
        const trail = s.sz * 1.5 + ease * ease * 75;
        const x1 = cx + Math.cos(s.angle) * s.dist;
        const y1 = cy + Math.sin(s.angle) * s.dist;
        const x0 = cx + Math.cos(s.angle) * Math.max(s.dist - trail, 0);
        const y0 = cy + Math.sin(s.angle) * Math.max(s.dist - trail, 0);

        const a    = Math.min(progress * 1.8, 1) * s.bright;
        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, `rgba(180, 182, 188, 0)`);
        grad.addColorStop(1, `rgba(240, 242, 248, ${a})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = s.sz * (0.5 + ease * 1.2);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        if (s.dist > maxDist) s.dist = Math.random() * 15 + 4;
      }

      // Gentle fade-to-dark at end (no flash — just smooth transition)
      if (progress > 0.78) {
        const t = (progress - 0.78) / 0.22;
        ctx.fillStyle = `rgba(2, 2, 6, ${t * 0.88})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (progress >= 1 && !doneRef.current) {
        doneRef.current = true;
        completeRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}

// ─── Stars ────────────────────────────────────────────────────────────
function Stars() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 60 + Math.random() * 55;
      arr[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      arr[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i*3+2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.005; });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={3000} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.055} color="#cce8ff" transparent opacity={0.50} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ─── Sun ─────────────────────────────────────────────────────────────
function SunMesh({ texture, selectedId }: { texture: THREE.Texture; selectedId: number | null }) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const opacityRef = useRef(1);
  useFrame(({ clock }, dt) => {
    if (!spriteRef.current) return;
    const muted = selectedId !== null;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, muted ? 0 : 1, Math.min(dt * 3.8, 1));
    spriteRef.current.material.opacity = opacityRef.current;
    spriteRef.current.material.rotation += dt * 0.018;
    spriteRef.current.visible = opacityRef.current > 0.02;
  });

  return (
    <group position={SUN_POSITION}>
      <sprite ref={spriteRef} scale={[13, 13, 1]}>
        <spriteMaterial
          map={texture}
          transparent
          alphaTest={0.25}
          depthWrite={true}
          sizeAttenuation
        />
      </sprite>
    </group>
  );
}

// ─── Orbit Path ──────────────────────────────────────────────────────
function OrbitPath({ planet, selected }: { planet: PlanetDatum; selected: boolean }) {
  const points = useMemo(() => {
    const orbit = getOrbitSpec(planet);
    const arr = new Float32Array(220 * 3);
    for (let i = 0; i < 220; i++) {
      const a = (i / 220) * Math.PI * 2;
      arr[i * 3]     = SUN_POSITION.x + Math.cos(a) * orbit.radius;
      arr[i * 3 + 1] = -0.035;
      arr[i * 3 + 2] = SUN_POSITION.z + Math.sin(a) * orbit.zRadius;
    }
    return arr;
  }, [planet]);

  const theme = PLANET_THEMES[planet.file] ?? PLANET_THEMES.neptune;

  return (
    <lineLoop>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={220} array={points} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial
        color={selected ? theme.glow : "#7aa8ff"}
        transparent
        opacity={selected ? 0.34 : 0.105}
        depthWrite={false}
      />
    </lineLoop>
  );
}

// ─── Hologram Accents ────────────────────────────────────────────────
function HologramAccents({
  radius,
  theme,
  opacity,
}: {
  radius: number;
  theme: { dot: string; wire: string; ring: string; atmos: string; light: string; glow: string };
  opacity: number;
}) {
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const sparks = useRef<THREE.Points>(null);

  const sparkPositions = useMemo(() => {
    const count = 72;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const band = i % 3;
      const r = radius * (1.22 + (band * 0.08));
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = Math.sin(i * 1.71) * radius * 0.34;
      arr[i * 3 + 2] = Math.sin(a) * r * 0.72;
    }
    return arr;
  }, [radius]);

  useFrame(({ clock }, dt) => {
    if (ringA.current) {
      ringA.current.rotation.x += dt * 0.16;
      ringA.current.rotation.z += dt * 0.10;
    }
    if (ringB.current) {
      ringB.current.rotation.y -= dt * 0.14;
      ringB.current.rotation.z += dt * 0.18;
    }
    if (sparks.current) {
      sparks.current.rotation.y += dt * 0.20;
      sparks.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.7) * 0.08;
    }
  });

  return (
    <group>
      <mesh ref={ringA} rotation={[Math.PI / 2.6, 0.22, 0]}>
        <torusGeometry args={[radius * 1.18, 0.004, 6, 220]} />
        <meshBasicMaterial color={theme.glow} transparent opacity={0.38 * opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ringB} rotation={[-Math.PI / 3.2, 0.78, 0.28]}>
        <torusGeometry args={[radius * 1.36, 0.003, 6, 220]} />
        <meshBasicMaterial color={theme.ring} transparent opacity={0.26 * opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <points ref={sparks}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={72} array={sparkPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={theme.glow} size={0.028} transparent opacity={0.52 * opacity} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

// ─── Orbital Node (appears around a selected planet) ─────────────────
function OrbitalNode({
  node,
  onSelect,
}: {
  node:     ProjectNode;
  onSelect: (n: ProjectNode) => void;
}) {
  const [hov, setHov] = useState(false);
  const isRight = node.angle <= 90 || node.angle >= 270;

  return (
    <Html center zIndexRange={[30, 20]} style={{ pointerEvents: "none" }}>
      <motion.button
        type="button"
        aria-label={`Open ${node.title}`}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          position: "relative",
          width: 38,
          height: 38,
          padding: 0,
          border: 0,
          borderRadius: "50%",
          background: "transparent",
          pointerEvents: "auto",
          cursor: "pointer",
          outline: "none",
        }}
        onPointerEnter={() => setHov(true)}
        onPointerLeave={() => setHov(false)}
        onFocus={() => setHov(true)}
        onBlur={() => setHov(false)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(node);
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: node.id * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Clickable node target */}
        <motion.span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 6,
            borderRadius: "50%",
            border: "1px solid rgba(120, 190, 255, 0.35)",
            background: "radial-gradient(circle, rgba(130, 205, 255, 0.16) 0%, rgba(60, 130, 255, 0.05) 54%, rgba(60, 130, 255, 0) 72%)",
            boxShadow: hov
              ? "0 0 18px rgba(105, 185, 255, 0.38), inset 0 0 12px rgba(120, 200, 255, 0.12)"
              : "0 0 10px rgba(80, 160, 255, 0.18)",
            transition: "box-shadow 0.2s ease, border-color 0.2s ease",
          }}
          animate={{
            borderColor: hov
              ? "rgba(185, 225, 255, 0.82)"
              : "rgba(120, 190, 255, 0.35)",
          }}
        />
        <motion.div
          style={{
            position: "absolute",
            inset: 9,
            borderRadius: "50%",
            border: "1px solid rgba(80, 160, 255, 0.55)",
            pointerEvents: "none",
          }}
          animate={{ scale: [1, 2.15, 1], opacity: [0.58, 0, 0.58] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: node.id * 0.35 }}
        />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: hov ? "rgba(218, 242, 255, 0.98)" : "rgba(86, 170, 255, 0.88)",
            boxShadow: hov
              ? "0 0 12px rgba(160, 218, 255, 0.95), 0 0 30px rgba(80, 160, 255, 0.52)"
              : "0 0 9px rgba(80, 160, 255, 0.72)",
            transition: "background 0.2s ease, box-shadow 0.2s ease",
            pointerEvents: "none",
          }}
        />

        {/* Hover: line, then project metadata */}
        <AnimatePresence>
          {hov && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{
                position: "absolute",
                top: "50%",
                [isRight ? "left" : "right"]: 30,
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                flexDirection: isRight ? "row" : "row-reverse",
                pointerEvents: "auto",
                whiteSpace: "nowrap",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 54 }}
                exit={{ width: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  height: 1,
                  background: "linear-gradient(90deg, rgba(120,200,255,0.1), rgba(120,200,255,0.78))",
                  flexShrink: 0,
                }}
              />
              <motion.div
                initial={{ opacity: 0, x: isRight ? -6 : 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRight ? -4 : 4 }}
                transition={{ duration: 0.2, delay: 0.16, ease: "easeOut" }}
                style={{
                  position: "relative",
                  padding: isRight ? "6px 9px 6px 11px" : "6px 11px 6px 9px",
                  borderTop: "1px solid rgba(120, 190, 255, 0.16)",
                  borderBottom: "1px solid rgba(120, 190, 255, 0.10)",
                  background: "linear-gradient(90deg, rgba(4, 12, 28, 0.72), rgba(4, 12, 28, 0.18))",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  overflow: "hidden",
                }}
              >
                <motion.span
                  aria-hidden="true"
                  initial={{ x: isRight ? "-100%" : "100%" }}
                  animate={{ x: isRight ? "115%" : "-115%" }}
                  transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: "65%",
                    background: "linear-gradient(90deg, transparent, rgba(120, 210, 255, 0.16), transparent)",
                  }}
                />
                <div style={{
                  color: "rgba(215, 235, 255, 0.92)",
                  fontSize: "10px",
                  letterSpacing: "0.24em",
                  fontFamily: "var(--font-body, sans-serif)",
                  textShadow: "0 0 10px rgba(80, 160, 255, 0.75)",
                  lineHeight: 1,
                }}>
                  {node.title}
                </div>
                <div style={{
                  color: "rgba(130, 185, 255, 0.48)",
                  fontSize: "8px",
                  letterSpacing: "0.22em",
                  fontFamily: "var(--font-body, sans-serif)",
                  marginTop: 5,
                  lineHeight: 1,
                }}>
                  {node.role.toUpperCase()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </Html>
  );
}

// ─── Globe Node (depth-aware node on hologram sphere surface) ────────
function GlobeNode({
  node,
  pos,
  onSelect,
  sphereRadius,
  theme,
}: {
  node:         ProjectNode;
  pos:          [number, number, number];
  onSelect:     (n: ProjectNode) => void;
  sphereRadius: number;
  theme:        { dot: string; wire: string; ring: string; atmos: string; light: string; glow: string };
}) {
  const [hov, setHov]   = useState(false);
  const groupRef        = useRef<THREE.Group>(null);
  const containerRef    = useRef<HTMLDivElement>(null);
  const coverRef        = useRef<HTMLDivElement>(null);
  const nW              = useRef(new THREE.Vector3());
  const cW              = useRef(new THREE.Vector3());
  const tmp             = useRef(new THREE.Vector3());

  useFrame(({ camera }) => {
    if (!groupRef.current || !containerRef.current || !coverRef.current) return;

    groupRef.current.getWorldPosition(nW.current);
    groupRef.current.parent?.parent?.getWorldPosition(cW.current);

    tmp.current.copy(nW.current).applyMatrix4(camera.matrixWorldInverse);
    const nz = tmp.current.z;
    tmp.current.copy(cW.current).applyMatrix4(camera.matrixWorldInverse);
    const cz = tmp.current.z;

    const relZ    = cz - nz;
    const t       = THREE.MathUtils.clamp(relZ / sphereRadius, 0, 1);
    const opacity = 1 - t;
    const scale   = 1.1 - t * 0.78;

    containerRef.current.style.opacity   = opacity.toFixed(3);
    containerRef.current.style.transform = `scale(${scale.toFixed(3)})`;
    coverRef.current.style.pointerEvents  = t > 0.35 ? "all" : "none";
  });

  const col = theme.glow;

  return (
    <group ref={groupRef} position={pos}>
      <Html center zIndexRange={[30, 20]} style={{ pointerEvents: "none" }}>
        <div
          ref={containerRef}
          style={{ transformOrigin: "center center", position: "relative", display: "inline-block" }}
        >
          <motion.button
            type="button"
            aria-label={`Open ${node.title}`}
            style={{
              appearance: "none", WebkitAppearance: "none",
              position: "relative", zIndex: 1,
              width: 34, height: 34, padding: 0, border: 0,
              borderRadius: "50%", background: "transparent",
              pointerEvents: "auto", cursor: "pointer", outline: "none",
            }}
            onPointerEnter={() => setHov(true)}
            onPointerLeave={() => setHov(false)}
            onClick={(e) => { e.stopPropagation(); onSelect(node); }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: node.id * 0.09, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Glow ring */}
            <span style={{
              position: "absolute", inset: 7, borderRadius: "50%",
              border: `1px solid ${hov ? col : `${col}66`}`,
              background: `radial-gradient(circle, ${col}22 0%, transparent 70%)`,
              boxShadow: hov ? `0 0 18px ${col}88, inset 0 0 10px ${col}22` : `0 0 8px ${col}44`,
              transition: "box-shadow 0.2s, border-color 0.2s",
            }} />
            {/* Pulse ring */}
            <motion.div
              style={{ position: "absolute", inset: 10, borderRadius: "50%", border: `1px solid ${col}88`, pointerEvents: "none" }}
              animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: node.id * 0.28 }}
            />
            {/* Center dot */}
            <span style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)", width: 5, height: 5, borderRadius: "50%",
              background: hov ? "#ffffff" : col,
              boxShadow: hov ? `0 0 12px #ffffff, 0 0 28px ${col}` : `0 0 8px ${col}`,
              transition: "background 0.2s, box-shadow 0.2s", pointerEvents: "none",
            }} />
            {/* Hover tooltip */}
            <AnimatePresence>
              {hov && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.10 }}
                  style={{
                    position: "absolute", top: "50%", left: 26,
                    transform: "translateY(-50%)", display: "flex", alignItems: "center",
                    pointerEvents: "none", whiteSpace: "nowrap", zIndex: 50,
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: 40 }} exit={{ width: 0 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: 1, background: `linear-gradient(90deg, transparent, ${col}cc)`, flexShrink: 0 }}
                  />
                  <motion.div
                    initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.16, delay: 0.12 }}
                    style={{
                      padding: "5px 10px 5px 11px",
                      borderTop: `1px solid ${col}22`, borderBottom: `1px solid ${col}18`,
                      background: "rgba(2,6,16,0.85)",
                      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                    }}
                  >
                    <div style={{ color: "rgba(230,245,255,0.95)", fontSize: 10, letterSpacing: "0.22em", lineHeight: 1, fontFamily: "var(--font-body,sans-serif)", textShadow: `0 0 10px ${col}` }}>
                      {node.title}
                    </div>
                    <div style={{ color: `${col}99`, fontSize: 8, letterSpacing: "0.20em", marginTop: 4, lineHeight: 1, fontFamily: "var(--font-body,sans-serif)" }}>
                      {node.role.toUpperCase()}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
          {/* Blocks pointer events when node is behind sphere */}
          <div
            ref={coverRef}
            style={{
              position: "absolute", top: "-4px", left: "-4px", right: "-4px", bottom: "-4px",
              zIndex: 10, pointerEvents: "none", borderRadius: "50%",
            }}
          />
        </div>
      </Html>
    </group>
  );
}


// ─── Planet-specific hologram fragment shaders ───────────────────────
// 3-D Simplex Noise (Ashima Arts / Stefan Gustavson, public domain)
// Included verbatim in every case so each ShaderMaterial is self-contained.
const _SN3 = `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);
    const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(
      i.z+vec4(0.,i1.z,i2.z,1.))
      +i.y+vec4(0.,i1.y,i2.y,1.))
      +i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.*x_);
    vec4 xx=x_*ns.x+ns.yyyy;
    vec4 yy=y_*ns.x+ns.yyyy;
    vec4 h=1.-abs(xx)-abs(yy);
    vec4 b0=vec4(xx.xy,yy.xy);
    vec4 b1=vec4(xx.zw,yy.zw);
    vec4 s0=floor(b0)*2.+1.;
    vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
  // Ridged noise: ridge peaks where snoise≈0 → crater-like outlines
  float rn(vec3 p){return 1.-abs(snoise(p));}
  // 4-octave fBm
  float fbm(vec3 p){
    float v=snoise(p)*.5;p*=2.1;
    v+=snoise(p)*.25;p*=2.1;
    v+=snoise(p)*.125;p*=2.1;
    v+=snoise(p)*.0625;
    return v;
  }
`;

function getPlanetFragmentShader(file: string): string {
  // vPos = normalize(position) passed from vertex shader — unit-sphere 3-D coordinate.
  // Sampling noise at vPos avoids the UV seam and gives seamless organic shapes.
  const DECL = `
    uniform vec3 uColor;
    uniform float uAlpha;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPos;
  `;

  switch (file) {

    // ── Earth ──────────────────────────────────────────────────────────
    // Hologram inner-core glow: rim light + subtle hex-scan shimmer.
    // Grid lines, particles, and orbital rings are rendered as separate meshes.
    case 'earth': return `
      uniform vec3 uColor;
      uniform float uAlpha;
      varying vec2 vUv;
      varying vec3 vNormal;
      void main(){
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        float rim   = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 3.0);
        float scanY = step(0.5, sin(vUv.y * 400.0));
        float inner = 0.03 + rim * 0.30 + scanY * 0.012;
        float a     = (inner + rim * 0.18) * uAlpha;
        gl_FragColor = vec4(uColor * inner, a);
      }
    `;

    // ── Mercury ────────────────────────────────────────────────────────
    // Ridged noise (1-|snoise|) peaks at zero-crossings → natural crater rims.
    // Three frequency layers → large, medium and small craters.
    case 'mercury': return DECL + _SN3 + `
      void main(){
        float c0=rn(vPos*4.5)*.50;   // large craters
        float c1=rn(vPos*10.)*.28;   // medium craters
        float c2=rn(vPos*22.)*.14;   // small craters
        float c3=rn(vPos*48.)*.08;   // micro texture
        float craters=clamp(c0+c1+c2+c3,0.,1.);
        float base=snoise(vPos*6.)*.05+.06;
        float rim=pow(1.-abs(vNormal.z),1.7);
        float b=base+craters*.72+rim*.38;
        float a=(0.06+craters*.88+rim*.2)*uAlpha;
        gl_FragColor=vec4(uColor*clamp(b,0.,1.),a);
      }
    `;

    // ── Venus ──────────────────────────────────────────────────────────
    // 3-D noise warps the latitude → organic swirling cloud bands.
    case 'venus': return DECL + _SN3 + `
      void main(){
        float lat=vUv.y;
        float warp =snoise(vPos*2.8)*.13;
        float warp2=snoise(vPos*5.5+vec3(1.7,0.,2.3))*.07;
        float b1=sin((lat+warp )*18.)*.5+.5;
        float b2=sin((lat+warp2)*9. +.4)*.5+.5;
        float bands=b1*.55+b2*.45;
        float turb=abs(snoise(vPos*9.))*.22+abs(snoise(vPos*20.))*.1;
        float scan=step(.79,sin(lat*130.+turb*6.))*.28;
        float bright=bands*.82+turb*.28+scan;
        float rim=pow(1.-abs(vNormal.z),1.5);
        float b=clamp(bright,0.,1.)*.88+rim*.45;
        gl_FragColor=vec4(uColor*b,(clamp(bright*.85,.12,1.)+rim*.28)*uAlpha);
      }
    `;

    // ── Mars ───────────────────────────────────────────────────────────
    // 3-D fBm terrain + latitude-based polar ice caps + one dust storm.
    case 'mars': return DECL + _SN3 + `
      void main(){
        float lat=vUv.y,lon=vUv.x;
        float polN=smoothstep(.80,.95,lat);
        float polS=smoothstep(.20,.05,lat);
        float polar=max(polN,polS);
        float terrain=clamp(fbm(vPos*3.)*.5+.20,0.,1.);
        float polScan=polar*(step(.86,sin(lat*110.))+step(.92,sin(lon*80.))*.5)*.55;
        // Dust storm — fixed on surface, comes in/out of view as sphere spins
        float stormD=length((vPos.xz-vec2(.55,.30))*vec2(1.8,2.2));
        float storm=smoothstep(.30,.0,stormD)*.25;
        float bright=mix(terrain,.92,polar)+polScan+storm;
        float rim=pow(1.-abs(vNormal.z),1.7);
        float b=clamp(bright,0.,1.)*.90+rim*.42;
        gl_FragColor=vec4(uColor*b,(clamp(bright*.88,.06,1.)+rim*.22)*uAlpha);
      }
    `;

    // ── Jupiter ────────────────────────────────────────────────────────
    // Noise-warped multi-frequency latitude bands + Great Red Spot oval.
    case 'jupiter': return DECL + _SN3 + `
      void main(){
        float lat=vUv.y;
        float warp=snoise(vPos*3.)*.045;
        float b1=sin((lat+warp     )*22.)*.5+.5;
        float b2=sin((lat+warp*.5  )*11.+.3)*.5+.5;
        float b3=sin((lat-warp*.25 )*6. +.7)*.5+.5;
        float bands=b1*.50+b2*.30+b3*.20;
        float edges=step(.875,sin((lat+warp)*22.))*.36
                   +step(.875,sin((lat+warp*.5)*44.))*.20;
        // Great Red Spot: southern hemisphere (~lat 23°S = vPos.y≈−0.39)
        float grs=length(vec2((vPos.x-.38)*2.6,(vPos.y+.39)*3.8));
        float storm    =smoothstep(.26,.10,grs)*.80;
        float stormRing=smoothstep(.34,.26,grs)*smoothstep(.20,.28,grs)*.55;
        float scan=step(.92,sin(lat*200.))*.12;
        float bright=bands*.78+edges+storm*.65+stormRing+scan;
        float rim=pow(1.-abs(vNormal.z),1.5);
        float b=clamp(bright,0.,1.)*.88+rim*.40;
        gl_FragColor=vec4(uColor*b,(clamp(bright*.85,.18,1.)+rim*.25)*uAlpha);
      }
    `;

    // ── Saturn ─────────────────────────────────────────────────────────
    // Fewer, softer bands than Jupiter — slight noise warp for organic feel.
    case 'saturn': return DECL + _SN3 + `
      void main(){
        float lat=vUv.y;
        float warp=snoise(vPos*2.2)*.028;
        float b1=sin((lat+warp    )*14.)*.5+.5;
        float b2=sin((lat+warp*.6 )*7. +.5)*.5+.5;
        float b3=sin((lat-warp*.3 )*3.2+.2)*.5+.5;
        float bands=b1*.50+b2*.35+b3*.15;
        float scan=step(.935,sin(lat*160.))*.10;
        float bright=bands*.72+scan+.12;
        float rim=pow(1.-abs(vNormal.z),1.5);
        float b=clamp(bright,.20,1.)*.88+rim*.45;
        gl_FragColor=vec4(uColor*b,(clamp(bright*.82,.28,1.)+rim*.30)*uAlpha);
      }
    `;

    // ── Uranus ─────────────────────────────────────────────────────────
    // Extreme axial tilt → diagonal banding; nearly featureless blue-green.
    case 'uranus': return DECL + _SN3 + `
      void main(){
        float lat=vUv.y,lon=vUv.x;
        float diagLat=lat*.60+lon*.40;  // simulate 98° tilt
        float b1=sin(diagLat*16.)*.5+.5;
        float b2=sin(lat*8.)*.5+.5;
        float bands=b1*.38+b2*.62;
        float tex=snoise(vPos*7.)*.06;
        float scan=step(.965,sin(lat*90.)*sin(lon*60.))*.18;
        float bright=.30+bands*.48+tex+scan;
        float rim=pow(1.-abs(vNormal.z),1.4);
        float b=clamp(bright,0.,1.)*.88+rim*.50;
        gl_FragColor=vec4(uColor*b,(clamp(bright*.82,.32,1.)+rim*.35)*uAlpha);
      }
    `;

    // ── Neptune ────────────────────────────────────────────────────────
    // Turbulent noise-warped bands + two dark storm ovals fixed on surface.
    case 'neptune': return DECL + _SN3 + `
      void main(){
        float lat=vUv.y;
        float warp=snoise(vPos*3.)*.10+snoise(vPos*7.)*.05;
        float band=sin((lat+warp)*14.)*.5+.5;
        float turb=abs(snoise(vPos*8.))*.22+abs(snoise(vPos*20.))*.10;
        float spot1=smoothstep(.22,.06,length(vPos.xz-vec2(.45,.32)));
        float spot2=smoothstep(.14,.03,length(vPos.xz-vec2(-.36,-.48)));
        float scan=step(.89,sin(lat*170.))*.16;
        float bright=band*.65+turb*.35+spot1*.78+spot2*.52+scan;
        float rim=pow(1.-abs(vNormal.z),1.5);
        float b=clamp(bright,0.,1.)*.88+rim*.45;
        gl_FragColor=vec4(uColor*b,(clamp(bright*.85,.15,1.)+rim*.28)*uAlpha);
      }
    `;

    default: return DECL + _SN3 + `
      void main(){
        float n=fbm(vPos*2.);
        float bright=.30+n*.45;
        float rim=pow(1.-abs(vNormal.z),1.7);
        gl_FragColor=vec4(uColor*(bright+rim*.42),(bright*.78+rim*.22)*uAlpha);
      }
    `;
  }
}

// ─── Hologram Globe ───────────────────────────────────────────────────
// ─── Earth orbital ring + satellite + trail ───────────────────────────
const EARTH_ORBITS = [
  { rx: 15*Math.PI/180, ry: 0,               rSpd: 0.001,  sSpd: 0.002, ra: 3.4, rb: 2.9, color: '#ffffff', opacity: 0.5  },
  { rx: 35*Math.PI/180, ry: 45*Math.PI/180,  rSpd: 0.0015, sSpd: 0.004, ra: 3.6, rb: 3.2, color: '#88ddff', opacity: 0.4  },
  { rx:-20*Math.PI/180, ry: 90*Math.PI/180,  rSpd: 0.0008, sSpd: 0.003, ra: 3.5, rb: 3.0, color: '#00ff88', opacity: 0.35 },
] as const;

function EarthOrbitRing({ rx, ry, rSpd, sSpd, ra, rb, color, opacity, entryMix }: {
  rx: number; ry: number; rSpd: number; sSpd: number;
  ra: number; rb: number; color: string; opacity: number; entryMix: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const satRef   = useRef<THREE.Mesh>(null);
  const tRef     = useRef(Math.random());
  const trailPts = useRef<Array<[number,number]>>([]);

  const curve = useMemo(() => new THREE.EllipseCurve(0,0,ra,rb,0,Math.PI*2,false,0), [ra,rb]);

  const orbitLine = useMemo(() => {
    const pts = curve.getPoints(200);
    const pos = new Float32Array((pts.length + 1) * 3);
    [...pts, pts[0]].forEach((p, i) => { pos[i*3]=p.x; pos[i*3+1]=0; pos[i*3+2]=p.y; });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Line(geo, new THREE.LineBasicMaterial({
      color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
  }, [curve, color, opacity]);

  const trailLine = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(25*3), 3));
    return new THREE.Line(geo, new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
  }, [color]);

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += rSpd * dt * 60;
    tRef.current = (tRef.current + sSpd * dt * 60) % 1;
    const pt = curve.getPoint(tRef.current);

    if (satRef.current) satRef.current.position.set(pt.x, 0, pt.y);

    trailPts.current.unshift([pt.x, pt.y]);
    if (trailPts.current.length > 25) trailPts.current.length = 25;

    if (trailPts.current.length > 1) {
      const n   = trailPts.current.length;
      const pos = new Float32Array(n * 3);
      trailPts.current.forEach(([x,y], i) => { pos[i*3]=x; pos[i*3+1]=0; pos[i*3+2]=y; });
      trailLine.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      trailLine.geometry.setDrawRange(0, n);
      (trailLine.material as THREE.LineBasicMaterial).opacity = 0.65 * entryMix;
      (orbitLine.material  as THREE.LineBasicMaterial).opacity = opacity * entryMix;
    }
  });

  return (
    <group ref={groupRef} rotation={[rx, ry, 0]}>
      <primitive object={orbitLine} />
      <primitive object={trailLine} />
      <mesh ref={satRef}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// ─── Earth coastline geometry (world-atlas 50m) ───────────────────────
function buildEarthCoastGeo(r: number): THREE.BufferGeometry {
  const lines = mesh(land50 as any, (land50 as any).objects.land) as { coordinates: number[][][] };
  const verts: number[] = [];
  const addPt = (lon: number, lat: number) => {
    const phi = lat * Math.PI / 180;
    const lam = lon * Math.PI / 180;
    verts.push(r * Math.cos(phi) * Math.cos(lam), r * Math.sin(phi), -r * Math.cos(phi) * Math.sin(lam));
  };
  for (const ring of lines.coordinates) {
    for (let i = 0; i < ring.length - 1; i++) {
      addPt(ring[i][0], ring[i][1]);
      addPt(ring[i + 1][0], ring[i + 1][1]);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  return geo;
}

function HologramGlobe({
  planet,
  nodes,
  onNodeSelect,
}: {
  planet:       PlanetDatum;
  nodes:        ProjectNode[];
  onNodeSelect: (n: ProjectNode) => void;
}) {
  const { gl }     = useThree();
  const spinRef    = useRef<THREE.Group>(null);
  const entryRef   = useRef<THREE.Group>(null);
  const entryT     = useRef(0);
  const [entryMix, setEntryMix] = useState(0);
  const isDragging = useRef(false);
  const lastX      = useRef(0);
  const lastY      = useRef(0);
  const visualSize = Math.max(planet.w, planet.h);
  const radius     = visualSize / 2;
  const startScale = Math.max(0.62, Math.min(0.9, Math.min(planet.w, planet.h) / visualSize));
  const theme      = PLANET_THEMES[planet.file] ?? PLANET_THEMES.neptune;

  const sphereMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(theme.dot) },
      uAlpha: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPos;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPos = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: getPlanetFragmentShader(planet.file),
    transparent: true,
    depthWrite: false,
  }), [theme.dot, planet.file]);
  useEffect(() => () => { sphereMat.dispose(); }, [sphereMat]);

  const coastGeo = useMemo(
    () => planet.file === 'earth' ? buildEarthCoastGeo(radius * 1.002) : null,
    [planet.file, radius],
  );
  useEffect(() => () => { coastGeo?.dispose(); }, [coastGeo]);

  // Depth-fading shader for Earth coastlines (lines fade at limb)
  const coastMat = useMemo(() => {
    if (planet.file !== 'earth') return null;
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor:   { value: new THREE.Color('#00ff88') },
        uOpacity: { value: 0 },
      },
      vertexShader: `
        varying float vFace;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vec3 N  = normalize(mat3(modelMatrix) * normalize(position));
          vec3 V  = normalize(cameraPosition - wp.xyz);
          vFace   = dot(N, V);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3  uColor;
        uniform float uOpacity;
        varying float vFace;
        void main() {
          float a = smoothstep(0.0, 0.18, vFace) * uOpacity;
          if (a < 0.01) discard;
          gl_FragColor = vec4(uColor, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [planet.file]);
  useEffect(() => () => { coastMat?.dispose(); }, [coastMat]);

  // Depth-fading dot shader — all planets
  const depthDotMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor:   { value: new THREE.Color(theme.dot) },
      uOpacity: { value: 0 },
    },
    vertexShader: `
      varying float vFace;
      void main() {
        vec4 wp  = modelMatrix * vec4(position, 1.0);
        vec3 N   = normalize(mat3(modelMatrix) * normalize(position));
        vec3 V   = normalize(cameraPosition - wp.xyz);
        vFace    = dot(N, V);
        vec4 mvp = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(5.0 / max(-mvp.z, 0.1), 1.0, 4.0);
        gl_Position  = projectionMatrix * mvp;
      }
    `,
    fragmentShader: `
      uniform vec3  uColor;
      uniform float uOpacity;
      varying float vFace;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        if (dot(c, c) > 0.25) discard;
        float a = smoothstep(-0.40, 0.0, vFace) * uOpacity;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [theme.dot]);
  useEffect(() => () => { depthDotMat.dispose(); }, [depthDotMat]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onMove = (e: PointerEvent) => {
      if (!isDragging.current || !spinRef.current) return;
      spinRef.current.rotation.y += (e.clientX - lastX.current) * 0.006;
      spinRef.current.rotation.x += (e.clientY - lastY.current) * 0.006;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
    };
    const onUp = () => { isDragging.current = false; };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup",   onUp);
    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup",   onUp);
    };
  }, [gl]);

  useFrame((_, dt) => {
    if (!isDragging.current && spinRef.current) {
      spinRef.current.rotation.y += dt * 0.22;
    }
    if (entryT.current < 1) {
      entryT.current = Math.min(entryT.current + dt * 1.85, 1);
      const eased = entryT.current * entryT.current * (3 - 2 * entryT.current);
      if (entryRef.current) entryRef.current.scale.setScalar(THREE.MathUtils.lerp(startScale, 1, eased));
      setEntryMix(eased);
    }
    const mix = entryT.current * entryT.current * (3 - 2 * entryT.current);
    if (coastMat)    coastMat.uniforms.uOpacity.value    = 0.80 * mix;
    depthDotMat.uniforms.uOpacity.value = 0.60 * mix;
  });

  const coreOpacity  = 0.88 * entryMix;
  const dotOpacity   = 0.55 * entryMix;
  const shellOpacity = entryMix * entryMix;
  const lineOpacity  = 0.38 * entryMix;

  useEffect(() => {
    sphereMat.uniforms.uAlpha.value = coreOpacity;
  }, [coreOpacity, sphereMat]);

  const nodePositions = useMemo(() => nodes.map((node, idx) => {
    const lon = (node.angle * Math.PI) / 180;
    const lat = idx % 2 === 0 ? 0.40 : -0.26;
    return {
      ...node,
      pos: [
        radius * Math.cos(lat) * Math.cos(lon),
        radius * Math.sin(lat),
        radius * Math.cos(lat) * Math.sin(lon),
      ] as [number, number, number],
    };
  }), [nodes, radius]);

  const dotPositions = useMemo(() => {
    const r = radius * 1.001;

    if (planet.file !== 'earth') {
      const count = 6000;
      const arr   = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const y     = 1 - (i / (count - 1)) * 2;
        const rr    = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        arr[i * 3]     = r * rr * Math.cos(theta);
        arr[i * 3 + 1] = r * y;
        arr[i * 3 + 2] = r * rr * Math.sin(theta);
      }
      return arr;
    }

    // Earth: draw land mask onto an off-screen canvas, keep dots over land only
    // objects.land is a GeometryCollection → feature() returns FeatureCollection
    const W = 1024, H = 512;
    const cvs = document.createElement('canvas');
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d')!;
    const landFC = feature(land50 as any, (land50 as any).objects.land) as any;
    // All rings must be subpaths of ONE path so fill('evenodd') works correctly.
    // Do NOT call beginPath inside the ring loop.
    ctx.beginPath();
    const drawPoly = (rings: number[][][]) => {
      for (const ring of rings) {
        ring.forEach(([lon, lat], i) => {
          const cx = ((lon + 180) / 360) * W;
          const cy = ((90 - lat) / 180) * H;
          if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
        });
        ctx.closePath();
      }
    };
    const features = Array.isArray(landFC.features) ? landFC.features : [landFC];
    for (const f of features) {
      const geom = f.geometry;
      if (!geom) continue;
      if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates) drawPoly(poly);
      } else if (geom.type === 'Polygon') {
        drawPoly(geom.coordinates);
      }
    }
    ctx.fillStyle = 'white';
    ctx.fill('evenodd');
    const imgData = ctx.getImageData(0, 0, W, H).data;

    const isLand = (x: number, wy: number, z: number) => {
      const lat = Math.asin(Math.max(-1, Math.min(1, wy / r))) * 180 / Math.PI;
      const lon = Math.atan2(-z, x) * 180 / Math.PI;
      const px  = Math.max(0, Math.min(W - 1, Math.floor(((lon + 180) / 360) * W)));
      const py  = Math.max(0, Math.min(H - 1, Math.floor(((90 - lat) / 180) * H)));
      return imgData[(py * W + px) * 4] > 128;
    };

    const pts: number[] = [];
    const total = 20000;
    for (let i = 0; i < total && pts.length < 18000; i++) {
      const ny    = 1 - (i / (total - 1)) * 2;
      const rr    = Math.sqrt(Math.max(0, 1 - ny * ny));
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const x  = r * rr * Math.cos(theta);
      const wy = r * ny;
      const z  = r * rr * Math.sin(theta);
      if (isLand(x, wy, z)) pts.push(x, wy, z);
    }
    return new Float32Array(pts);
  }, [planet.file, radius]);

  const beamPositions = useMemo(() => {
    if (nodePositions.length === 0) return new Float32Array(0);
    const pts: number[] = [];
    nodePositions.forEach(n => {
      const mag = Math.sqrt(n.pos[0] ** 2 + n.pos[1] ** 2 + n.pos[2] ** 2);
      const nx = n.pos[0] / mag, ny = n.pos[1] / mag, nz = n.pos[2] / mag;
      pts.push(n.pos[0], n.pos[1], n.pos[2]);
      pts.push(n.pos[0] + nx * 2.6, n.pos[1] + ny * 2.6, n.pos[2] + nz * 2.6);
    });
    return new Float32Array(pts);
  }, [nodePositions]);

  return (
    <group ref={entryRef}>
      <HologramAccents radius={radius} theme={theme} opacity={shellOpacity} />

      {/* Non-Earth: static outer scan rings */}
      {planet.file !== 'earth' && <>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.05, 0.004, 6, 220]} />
          <meshBasicMaterial color={theme.ring} transparent opacity={0.42 * shellOpacity} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0.28, 0]}>
          <torusGeometry args={[radius * 1.16, 0.003, 6, 180]} />
          <meshBasicMaterial color={theme.ring} transparent opacity={0.28 * shellOpacity} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[-Math.PI / 3.5, 0.82, 0]}>
          <torusGeometry args={[radius * 1.26, 0.002, 6, 180]} />
          <meshBasicMaterial color={theme.wire} transparent opacity={0.16 * shellOpacity} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </>}

      {/* Earth: 3 orbital rings with satellites */}
      {planet.file === 'earth' && EARTH_ORBITS.map((cfg, i) => (
        <EarthOrbitRing key={i} {...cfg} entryMix={entryMix} />
      ))}


      {/* Spinning core */}
      <group ref={spinRef}>
        {/* Planet surface shader */}
        <mesh
          onPointerDown={(e) => {
            e.stopPropagation();
            isDragging.current = true;
            lastX.current = e.clientX;
            lastY.current = e.clientY;
          }}
        >
          <sphereGeometry args={[radius, 64, 64]} />
          <primitive attach="material" object={sphereMat} />
        </mesh>

        {/* 10° lat/lon grid — all planets */}
        {Array.from({ length: 17 }, (_, i) => (-80 + i * 10) * Math.PI / 180).map((lat, i) => (
          <mesh key={`lat-${i}`} rotation={[lat, 0, 0]}>
            <torusGeometry args={[radius * Math.cos(lat), 0.0018, 4, 180]} />
            <meshBasicMaterial color={theme.wire} transparent opacity={(i === 8 ? 0.35 : 0.15) * entryMix} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
        {Array.from({ length: 12 }, (_, i) => i * Math.PI / 6).map((rot, i) => (
          <mesh key={`lon-${i}`} rotation={[0, rot, 0]}>
            <torusGeometry args={[radius, 0.0018, 4, 180]} />
            <meshBasicMaterial color={theme.wire} transparent opacity={0.09 * entryMix} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
        {/* Atmospheric glow — all planets (meshBasicMaterial: unaffected by lights, no solid-fill artifact) */}
        <mesh>
          <sphereGeometry args={[radius * 1.075, 32, 32]} />
          <meshBasicMaterial color={theme.glow} transparent opacity={0.045 * entryMix} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        {/* Outer rim wireframe — all planets */}
        <mesh>
          <sphereGeometry args={[radius * 1.1, 16, 16]} />
          <meshBasicMaterial color={theme.glow} wireframe transparent opacity={0.04 * entryMix} depthWrite={false} />
        </mesh>
        {/* Earth coastlines */}
        {coastGeo && coastMat && (
          <lineSegments geometry={coastGeo} material={coastMat} />
        )}

        {/* Surface dots — depth-fading, all planets */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={dotPositions.length / 3} array={dotPositions} itemSize={3} />
          </bufferGeometry>
          <primitive attach="material" object={depthDotMat} />
        </points>

        {/* Node beam rays */}
        {beamPositions.length > 0 && (
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" count={beamPositions.length / 3} array={beamPositions} itemSize={3} />
            </bufferGeometry>
            <lineBasicMaterial color={theme.glow} transparent opacity={lineOpacity} depthWrite={false} />
          </lineSegments>
        )}

        {/* Depth-aware nodes */}
        {entryMix > 0.72 && nodePositions.map((n) => (
          <GlobeNode key={n.id} node={n} pos={n.pos} onSelect={onNodeSelect} sphereRadius={radius} theme={theme} />
        ))}
      </group>

      <pointLight color={theme.light} intensity={2.5 * entryMix} distance={8}  decay={2} />
      <pointLight color={theme.dot}   intensity={0.6 * entryMix} distance={14} decay={2} />
    </group>
  );
}

// ─── Planet ───────────────────────────────────────────────────────────
function Planet({
  data, texture, nodes, selectedId, anySelected, onSelect, onNodeSelect,
}: {
  data:         PlanetDatum;
  texture:      THREE.Texture;
  nodes:        ProjectNode[];
  selectedId:   number | null;
  anySelected:  boolean;
  onSelect:     (d: PlanetDatum) => void;
  onNodeSelect: (n: ProjectNode) => void;
  nodePanelOpen: boolean;
}) {
  const groupRef  = useRef<THREE.Group>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const spriteOp  = useRef(1);
  const orbitPos     = useRef(new THREE.Vector3());
  const [hov, setHov] = useState(false);

  const isSelected = selectedId === data.id;
  const scale = hov ? 1.03 : 1.0;
  const sw = data.w * scale;
  const sh = data.h * scale;

  useFrame(({ clock }, dt) => {
    if (!groupRef.current) return;
    const elapsed = clock.getElapsedTime();
    setPlanetOrbitPosition(data, elapsed, orbitPos.current);
    groupRef.current.position.copy(orbitPos.current);
    groupRef.current.rotation.y = Math.sin(elapsed * 0.12 + data.phase) * 0.06;

    const cached = livePos.get(data.id) ?? new THREE.Vector3();
    cached.copy(orbitPos.current);
    livePos.set(data.id, cached);

    // Fade: 0 when this planet is selected (hologram takes over), 0.08 when another is, 1 otherwise
    const targetOp = isSelected ? 0 : (anySelected ? 0.08 : 1);
    spriteOp.current = THREE.MathUtils.lerp(spriteOp.current, targetOp, dt * 2.5);
    if (spriteRef.current) {
      spriteRef.current.material.opacity = spriteOp.current;
      spriteRef.current.visible = spriteOp.current > 0.01;
      const settle = THREE.MathUtils.lerp(0.96, 1, spriteOp.current);
      spriteRef.current.scale.set(sw * settle, sh * settle, 1);
      spriteRef.current.material.rotation += dt * (0.05 + data.id * 0.006);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Hologram globe — scales in on selection */}
      {isSelected && <HologramGlobe planet={data} nodes={nodes} onNodeSelect={onNodeSelect} />}

      {/* Sprite — fades out smoothly when hologram activates */}
      <sprite
        ref={spriteRef}
        scale={[sw, sh, 1]}
        onClick={(e) => { e.stopPropagation(); if (!anySelected || isSelected) onSelect(data); }}
        onPointerOver={() => { if (!anySelected || isSelected) { setHov(true); document.body.style.cursor = "pointer"; } }}
        onPointerOut={() => { setHov(false); document.body.style.cursor = "default"; }}
      >
        <spriteMaterial
          map={texture}
          transparent
          alphaTest={0.04}
          color={hov ? "#ddf0ff" : "#ffffff"}
          depthWrite={false}
          sizeAttenuation
        />
      </sprite>

      {hov && !isSelected && (
        <Html
          position={[0, sh / 2 + 0.18, 0]}
          zIndexRange={[0, 0]}
          style={{ pointerEvents: "none" }}
        >
          {/* translateX(-50%) centers; translateY(-100%) ensures label sits fully above anchor */}
          <div style={{
            transform: "translateX(-50%) translateY(-100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none",
            userSelect: "none",
          }}>
            {/* Label box */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
              padding: "8px 18px 9px",
              border: "1px solid rgba(130,185,255,0.13)",
              background: "rgba(3,5,14,0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              marginBottom: "0",
            }}>
              <span style={{
                color: "rgba(215,235,255,0.95)",
                fontSize: "12px",
                fontWeight: 300,
                letterSpacing: "0.35em",
                fontFamily: "var(--font-body, sans-serif)",
                whiteSpace: "nowrap",
                textShadow: "0 0 18px rgba(80,160,255,0.85)",
                lineHeight: 1,
              }}>
                {data.name}
              </span>
              <span style={{
                color: "rgba(145,195,255,0.40)",
                fontSize: "9px",
                fontWeight: 300,
                letterSpacing: "0.45em",
                fontFamily: "var(--font-body, sans-serif)",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}>
                {data.type.toUpperCase()}
              </span>
            </div>
            {/* Connector line pointing down toward planet */}
            <div style={{
              width: "1px",
              height: "12px",
              background: "linear-gradient(to bottom, rgba(130,185,255,0.22), rgba(130,185,255,0))",
            }} />
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Camera Rig ───────────────────────────────────────────────────────
function CameraRig({ selectedId, nodeSelected }: { selectedId: number | null; nodeSelected: boolean }) {
  const camPos = useMemo(() => DEFAULT_CAM.clone(), []);
  const look   = useMemo(() => DEFAULT_LOOK.clone(), []);

  useFrame(({ camera }, dt) => {
    const s = Math.min(dt * 1.8, 0.1);
    let tPos: THREE.Vector3;
    let tLook: THREE.Vector3;

    if (selectedId !== null) {
      const pp = livePos.get(selectedId);
      if (pp) {
        // Follow the planet on its live orbital position.
        const planet = PLANETS.find((p) => p.id === selectedId);
        const visualSize = planet ? Math.max(planet.w, planet.h) : 2;
        const viewDistance = Math.max(3.55, visualSize * 0.82 + 2.05);
        const detailDistance = Math.max(2.8, visualSize * 0.66 + 1.65);
        tPos  = nodeSelected
          ? new THREE.Vector3(pp.x, pp.y + 0.62, pp.z + detailDistance)
          : new THREE.Vector3(pp.x, pp.y + 1.12, pp.z + viewDistance);
        tLook = pp.clone();
      } else {
        tPos  = DEFAULT_CAM.clone();
        tLook = DEFAULT_LOOK.clone();
      }
    } else {
      tPos  = DEFAULT_CAM.clone();
      tLook = DEFAULT_LOOK.clone();
    }

    camPos.lerp(tPos, s);
    look.lerp(tLook, s);
    camera.position.copy(camPos);
    camera.lookAt(look);
  });

  return null;
}

// ─── Solar Scene ──────────────────────────────────────────────────────
function SolarScene({ selectedId, onSelect, onNodeSelect, nodeSelected, dynamicNodes }: {
  selectedId:   number | null;
  onSelect:     (d: PlanetDatum) => void;
  onNodeSelect: (n: ProjectNode) => void;
  nodeSelected: boolean;
  dynamicNodes: Record<number, ProjectNode[]>;
}) {
  const textures = useTexture({
    sun:     "/sun.png",
    mercury: "/mercury.png",
    venus:   "/venus.png",
    earth:   "/earth.png",
    mars:    "/mars.png",
    jupiter: "/jupiter.png",
    saturn:  "/saturn.png",
    uranus:  "/uranus.png",
    neptune: "/neptune.png",
  });

  // Drei's useTexture doesn't set sRGB colorSpace automatically —
  // without this, PNG colors appear washed-out or too dark on some files.
  Object.values(textures).forEach((t) => {
    if (t.colorSpace !== THREE.SRGBColorSpace) {
      t.colorSpace  = THREE.SRGBColorSpace;
      t.needsUpdate = true;
    }
  });

  return (
    <>
      <ambientLight intensity={0.22} color="#0a1020" />
      <pointLight position={[SUN_POSITION.x, 2, SUN_POSITION.z]} intensity={3.5} color="#ff9944" distance={150} decay={1.1} />
      <Stars />
      <SunMesh texture={textures.sun} selectedId={selectedId} />
      {PLANETS.map((p) => (
        <OrbitPath key={`orbit-${p.id}`} planet={p} selected={selectedId === p.id} />
      ))}
      {PLANETS.map((p) => (
        <Planet
          key={p.id}
          data={p}
          texture={textures[p.file as keyof typeof textures]}
          nodes={dynamicNodes[p.id] ?? PLANET_NODES[p.id] ?? []}
          selectedId={selectedId}
          anySelected={selectedId !== null}
          onSelect={onSelect}
          onNodeSelect={onNodeSelect}
          nodePanelOpen={nodeSelected}
        />
      ))}
      <CameraRig selectedId={selectedId} nodeSelected={nodeSelected} />
    </>
  );
}

// ─── Project Panel ────────────────────────────────────────────────────
function ProjectPanel({ planet, onBack }: { planet: PlanetDatum; onBack: () => void }) {
  const detail = getPlanetDetail(planet);
  const rows: [string, string][] = [
    ["TITLE", detail.title],
    ["YEAR", detail.year],
    ["ROLE", detail.role],
    ["STACK", detail.stack],
  ];

  return (
    <motion.div
      key={planet.id}
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "110%", opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-0 top-0 bottom-0 w-80 flex flex-col px-8 py-20"
      style={{
        background: "linear-gradient(to left, rgba(5,5,8,0.96) 55%, rgba(5,5,8,0.45) 100%)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        zIndex: 12,
      }}
    >
      <p className="text-white/25 text-[10px] font-light mb-3" style={{ letterSpacing: "0.35em" }}>
        {planet.type.toUpperCase()}
      </p>
      <h2 className="font-display text-white font-light mb-8" style={{ fontSize: "2rem", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
        {planet.name}
      </h2>
      <div className="h-[1px] bg-white/10 mb-6" />
      <div className="space-y-5 flex-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between">
            <span className="text-white/25 text-[10px] font-light" style={{ letterSpacing: "0.25em" }}>{label}</span>
            <span className="text-white/30 text-xs font-light text-right max-w-[10.5rem] leading-relaxed">{value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <span className="text-white/25 text-[10px] font-light" style={{ letterSpacing: "0.25em" }}>STATUS</span>
          <StatusBadge label={detail.status} />
        </div>
      </div>
      <div className="h-[1px] bg-white/10 my-6" />
      <p className="text-white/20 text-xs font-light leading-relaxed mb-8">
        {detail.desc}
      </p>
      <button
        className="text-white/30 hover:text-white/65 transition-colors duration-300 text-xs font-light text-left"
        style={{ letterSpacing: "0.22em" }}
        onClick={onBack}
      >
        ← BACK TO SYSTEM
      </button>
    </motion.div>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-light leading-none text-emerald-300/75" style={{ letterSpacing: "0.12em" }}>
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center leading-none">
        <span className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="block h-3.5 w-3.5 rounded-full bg-emerald-400/25"
            animate={{ scale: [1, 2.1, 1], opacity: [0.65, 0, 0.65] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="block h-2.5 w-2.5 rounded-full border border-emerald-300/50"
            animate={{ scale: [1, 1.28, 1], opacity: [0.85, 0.45, 0.85] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.18 }}
          />
        </span>
        <span className="relative block h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
      </span>
      {label}
    </span>
  );
}

// ─── Node Detail Panel ────────────────────────────────────────────────
function NodeDetailPanel({ node, onClose }: { node: ProjectNode; onClose: () => void }) {
  const rows: [string, string][] = [
    ["YEAR", node.year],
    ["STACK", node.stack],
  ];

  const Corner = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => {
    const t = pos[0] === "t";
    const l = pos[1] === "l";
    return (
      <div style={{
        position: "absolute",
        [t ? "top" : "bottom"]: 0,
        [l ? "left" : "right"]: 0,
        width: 18, height: 18,
        [`border${t ? "Top" : "Bottom"}`]: "1px solid rgba(95,175,255,0.62)",
        [`border${l ? "Left" : "Right"}`]: "1px solid rgba(95,175,255,0.62)",
      }} />
    );
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 70,
          background: "rgba(0, 0, 0, 0.68)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px, 5vw, 72px)",
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.94, y: 14 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "relative",
            width: "min(860px, calc(100vw - 48px))",
            maxHeight: "min(680px, calc(100vh - 96px))",
            background: "linear-gradient(180deg, rgba(3, 7, 19, 0.98), rgba(1, 4, 13, 0.97))",
            border: "1px solid rgba(80, 160, 255, 0.28)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.72), 0 0 0 1px rgba(120,190,255,0.04) inset, 0 0 55px rgba(40,120,255,0.12)",
            overflow: "hidden",
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Scan line reveal */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{
              height: 1,
              background: "linear-gradient(to right, transparent, rgba(95,180,255,0.78), transparent)",
              transformOrigin: "left",
              flexShrink: 0,
            }}
          />

          <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

          <div style={{ padding: "clamp(28px, 4vw, 42px)", display: "flex", flexDirection: "column", minHeight: 0 }}>
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 24, flexShrink: 0 }}>
              <span style={{ color: "rgba(90,165,255,0.62)", fontSize: 10, letterSpacing: "0.42em", fontFamily: "var(--font-body, sans-serif)", lineHeight: 1.5 }}>
                NODE_{String(node.id).padStart(2, "0")} — {node.role.toUpperCase()}
              </span>
              <button
                onClick={onClose}
                style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, letterSpacing: "0.28em", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body, sans-serif)", transition: "color 0.2s", flexShrink: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.62)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.28)")}
              >
                ESC
              </button>
            </div>

            {/* Title */}
            <h3 style={{
              color: "rgba(225, 240, 255, 0.98)",
              fontFamily: "var(--font-display, serif)",
              fontSize: "clamp(2.4rem, 5vw, 4.25rem)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
              marginBottom: 0,
              flexShrink: 0,
            }}>
              {node.title}
            </h3>

            <div style={{ height: 1, background: "rgba(70,145,255,0.16)", margin: "24px 0", flexShrink: 0 }} />

            {/* Data rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22, flexShrink: 0 }}>
              {rows.map(([label, val]) => (
                <div key={label} style={{ display: "grid", gridTemplateColumns: "76px minmax(0, 1fr)", gap: 16, alignItems: "flex-start" }}>
                  <span style={{ color: "rgba(90,165,255,0.46)", fontSize: 10, letterSpacing: "0.34em", fontFamily: "var(--font-body, sans-serif)", paddingTop: 2 }}>
                    {label}
                  </span>
                  <span style={{ color: "rgba(205,224,255,0.68)", fontSize: 12, fontFamily: "var(--font-body, sans-serif)", letterSpacing: "0.04em", lineHeight: 1.6 }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div
              style={{
                maxHeight: "clamp(150px, 25vh, 260px)",
                overflowY: "auto",
                paddingRight: 10,
                marginBottom: 26,
                minHeight: 0,
              }}
            >
              <p style={{ color: "rgba(185,210,255,0.52)", fontSize: 13, lineHeight: 1.9, fontFamily: "var(--font-body, sans-serif)", letterSpacing: "0.02em", whiteSpace: "pre-line" }}>
                {node.desc}
              </p>
            </div>

            {/* Bottom accent + link */}
            <div style={{ height: 1, background: "rgba(70,145,255,0.12)", marginBottom: 18, flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexShrink: 0 }}>
              {node.url && (
                <a
                  href={node.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "rgba(105,180,255,0.78)",
                    fontSize: 11,
                    letterSpacing: "0.28em",
                    fontFamily: "var(--font-body, sans-serif)",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(105,180,255,0.25)",
                    paddingBottom: 3,
                    transition: "color 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(170,220,255,0.98)"; e.currentTarget.style.borderBottomColor = "rgba(170,220,255,0.55)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(105,180,255,0.78)"; e.currentTarget.style.borderBottomColor = "rgba(105,180,255,0.25)"; }}
                >
                  VIEW PROJECT →
                </a>
              )}
              <span style={{ color: "rgba(90,165,255,0.28)", fontSize: 10, letterSpacing: "0.35em", fontFamily: "var(--font-body, sans-serif)", whiteSpace: "nowrap" }}>
                ASTRA / EARTH
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────
export default function SolarSystem({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected,      setSelected]      = useState<PlanetDatum | null>(null);
  const [selectedNode,  setSelectedNode]  = useState<ProjectNode | null>(null);
  const [phase,         setPhase]         = useState<"idle" | "warp" | "scene">("idle");
  const [isExiting,     setIsExiting]     = useState(false);
  const [dynamicNodes,  setDynamicNodes]  = useState<Record<number, ProjectNode[]>>({});

  useEffect(() => {
    fetch("/api/planet-nodes")
      .then((r) => r.ok ? r.json() : [])
      .then((rows: { planetId: number; id: string; title: string; role: string; year: string; stack: string; desc: string; url: string | null; angle: number }[]) => {
        const map: Record<number, ProjectNode[]> = {};
        rows.forEach((r, idx) => {
          if (!map[r.planetId]) map[r.planetId] = [];
          map[r.planetId].push({ id: idx + 1, title: r.title, role: r.role, year: r.year, stack: r.stack, desc: r.desc, url: r.url ?? "", angle: r.angle });
        });
        setDynamicNodes(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setPhase("warp");
      setIsExiting(false);
    } else {
      const t = setTimeout(() => {
        setPhase("idle");
        setSelected(null);
        setSelectedNode(null);
        setIsExiting(false);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleWarpDone  = useCallback(() => setPhase("scene"), []);
  const handleExitDone  = useCallback(() => { onClose(); }, [onClose]);

  const handleSelect = useCallback((d: PlanetDatum) => {
    setSelected((prev) => (prev?.id === d.id ? null : d));
    setSelectedNode(null);
  }, []);

  const handleNodeSelect = useCallback((n: ProjectNode) => {
    setSelectedNode(n);
  }, []);

  const navigate = useCallback((dir: "prev" | "next") => {
    setSelected((prev) => {
      if (!prev) return prev;
      const idx  = PLANETS.findIndex((p) => p.id === prev.id);
      const next = PLANETS[dir === "next" ? idx + 1 : idx - 1];
      return next ?? prev;
    });
    setSelectedNode(null);
  }, []);

  useEffect(() => {
    if (phase !== "scene") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")      { setSelectedNode(null); if (!selectedNode) setSelected(null); }
      if (e.key === "ArrowLeft")   navigate("prev");
      if (e.key === "ArrowRight")  navigate("next");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, navigate, selectedNode]);

  const handleClose = () => {
    setSelected(null);
    setSelectedNode(null);
    document.body.style.cursor = "default";
    setIsExiting(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[60] bg-[#050508] overflow-hidden"
        >
          {/* Three.js canvas — mounted immediately so textures preload during the warp */}
          <div className="absolute inset-0">
            <Canvas
              camera={{ position: [DEFAULT_CAM.x, DEFAULT_CAM.y, DEFAULT_CAM.z], fov: 55 }}
              gl={{ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false }}
              dpr={[1, 1.5]}
              performance={{ min: 0.5 }}
              style={{ background: "#050508" }}
            >
              <Suspense fallback={null}>
                <SolarScene
                  selectedId={selected?.id ?? null}
                  onSelect={handleSelect}
                  onNodeSelect={handleNodeSelect}
                  nodeSelected={selectedNode !== null}
                  dynamicNodes={dynamicNodes}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* Dark cover — prevents canvas flash before warp overlay mounts */}
          {phase !== "scene" && !isExiting && (
            <div className="absolute inset-0 bg-[#050508]" style={{ zIndex: 4 }} />
          )}

          {/* Exit warp overlay — plays when EXIT is pressed, then closes */}
          <AnimatePresence>
            {isExiting && (
              <motion.div
                className="absolute inset-0 bg-[#050508]"
                initial={{ opacity: 1 }}
                style={{ zIndex: 20 }}
              >
                <WarpCanvas onComplete={handleExitDone} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Warp overlay — sits on top of canvas during entry animation */}
          <AnimatePresence>
            {phase === "warp" && (
              <motion.div
                className="absolute inset-0"
                style={{ zIndex: 5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              >
                <WarpCanvas onComplete={handleWarpDone} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <AnimatePresence>
            {phase === "scene" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 pt-7"
                style={{ zIndex: 10 }}
              >
                <div className="flex items-center gap-3 opacity-45 pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="white" strokeWidth="1" strokeLinejoin="round" fill="none" />
                  </svg>
                  <span className="text-white text-xs font-light" style={{ letterSpacing: "0.38em" }}>ASTRA</span>
                </div>
                <button
                  className="text-white/40 hover:text-white/75 transition-colors duration-300 text-xs font-light"
                  style={{ letterSpacing: "0.28em" }}
                  onClick={handleClose}
                >
                  ← EXIT
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom hint / navigation — same position, swap on planet select */}
          <AnimatePresence mode="wait">
            {phase === "scene" && !selected && (
              <motion.div
                key="hint"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, delay: 0.3 }}
                style={{ zIndex: 10, position: "absolute", bottom: "2.75rem", left: "50%", transform: "translateX(-50%)", pointerEvents: "none", whiteSpace: "nowrap" }}
              >
                <p className="text-white/22 text-[10px] font-light" style={{ letterSpacing: "0.32em", textAlign: "center" }}>
                  SELECT A PLANET
                </p>
              </motion.div>
            )}
            {phase === "scene" && selected && !selectedNode && (
              <motion.div
                key="nav"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                style={{ zIndex: 10, position: "absolute", bottom: "2.75rem", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "1rem", whiteSpace: "nowrap" }}
              >
                {/* Left arrow */}
                <button
                  onClick={() => navigate("prev")}
                  disabled={selected.id === PLANETS[0].id}
                  className="transition-colors duration-200"
                  style={{
                    background: "none", border: "none", cursor: selected.id === PLANETS[0].id ? "default" : "pointer",
                    color: selected.id === PLANETS[0].id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.42)",
                    fontSize: "13px", padding: "4px 10px", letterSpacing: "0.05em",
                  }}
                  onMouseEnter={(e) => { if (selected.id !== PLANETS[0].id) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.82)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = selected.id === PLANETS[0].id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.42)"; }}
                >
                  ←
                </button>

                {/* English planet name */}
                <span style={{
                  color: "rgba(255,255,255,0.78)", fontSize: "11px", fontWeight: 300,
                  letterSpacing: "0.50em", fontFamily: "var(--font-body, sans-serif)",
                  whiteSpace: "nowrap", textTransform: "uppercase", minWidth: "70px", textAlign: "center",
                }}>
                  {selected.file}
                </span>

                {/* Right arrow */}
                <button
                  onClick={() => navigate("next")}
                  disabled={selected.id === PLANETS[PLANETS.length - 1].id}
                  className="transition-colors duration-200"
                  style={{
                    background: "none", border: "none", cursor: selected.id === PLANETS[PLANETS.length - 1].id ? "default" : "pointer",
                    color: selected.id === PLANETS[PLANETS.length - 1].id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.42)",
                    fontSize: "13px", padding: "4px 10px", letterSpacing: "0.05em",
                  }}
                  onMouseEnter={(e) => { if (selected.id !== PLANETS[PLANETS.length - 1].id) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.82)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = selected.id === PLANETS[PLANETS.length - 1].id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.42)"; }}
                >
                  →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Project panel — hidden while a node detail is open */}
          <AnimatePresence>
            {phase === "scene" && selected && !selectedNode && (
              <ProjectPanel planet={selected} onBack={() => setSelected(null)} />
            )}
          </AnimatePresence>

          {/* Node detail panel — centered system UI */}
          <AnimatePresence>
            {phase === "scene" && selectedNode && (
              <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
