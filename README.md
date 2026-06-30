<div align="center">

<img src="public/space-bg.jpg" alt="ASTRA" width="100%" style="border-radius:12px;margin-bottom:16px" />
![Uploading image.png…]()


# ASTRA

**디스코드 커뮤니티를 위한 우주 테마 풀스택 웹 플랫폼**

행성 기반 3D 네비게이션, 길드 시스템, 자체 경제 생태계, Discord OAuth까지<br>
커뮤니티 운영에 필요한 모든 것을 하나의 웹 플랫폼으로 통합했습니다.

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![NextAuth](https://img.shields.io/badge/NextAuth.js-000000?style=for-the-badge&logo=auth0&logoColor=white)](https://next-auth.js.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

🔗 **[sign-company.co.kr](https://sign-company.co.kr)**

</div>

---

## 개요

ASTRA는 Discord 커뮤니티를 위해 설계한 우주 테마 커뮤니티 플랫폼입니다. 단순 소개 페이지가 아닌, 길드 결성·포인트 경제·공지 게시판·실시간 채팅·프로필까지 실제 커뮤니티 운영에 필요한 기능을 웹에서 통합 제공합니다.

메인 화면은 React Three Fiber로 구현된 **3D 태양계**로, 각 행성이 커뮤니티의 기능 영역과 1:1 매핑되는 인터랙티브 네비게이션 역할을 합니다.

---

## 주요 기능

### 🪐 3D 태양계 네비게이션

행성 8개가 각각 커뮤니티 기능으로 연결되는 횡스크롤 3D 메인 화면. 행성들은 스프라이트 기반으로 렌더링되며 각기 다른 속도와 진폭의 밥(bobbing) 애니메이션을 가집니다. 지구(Earth) 행성에는 TopoJSON 데이터 기반의 실시간 세계 지도가 구형 메시 위에 렌더링됩니다.

| 행성 | 연결 기능 |
|------|-----------|
| Mercury | 출석 체크 & 포인트 |
| Venus | MoneyLab (자체 화폐 경제) |
| Earth | 커뮤니티 게시판 |
| Mars | 길드 시스템 |
| Jupiter | ASTRA BOT |
| Saturn | 이벤트 & 공지 |
| Uranus | 유저 프로필 |
| Neptune | 포트폴리오 |

### 👥 길드 시스템

유저가 직접 길드를 만들고 멤버를 초대하는 팀 기반 기능. 길드별 채팅, 기부(포인트 기여), 출석 등의 활동으로 길드 XP와 레벨을 올릴 수 있습니다. LEADER / SUBLEADER / MEMBER 권한 구조로 운영됩니다.

### 💰 MoneyLab (포인트 경제)

커뮤니티 전용 화폐(SGC) 시스템. 출석, 게시판 활동, 길드 기여로 포인트를 획득하고 인벤토리 아이템 구매에 사용합니다. SGC 시세는 DB에 기록되어 변동 흐름을 추적할 수 있습니다. Discord 봇과 포인트 DB를 공유해 웹과 봇 간 잔액이 실시간 동기화됩니다.

### 📢 공지 시스템

NOTICE / EVENT / UPDATE 세 카테고리의 공지를 게시하고, 유저가 댓글을 달면 매니저가 대댓글로 공식 응답하는 구조입니다. 공지 작성 시 Discord 웹훅으로 서버에 자동 전송됩니다. 핀 고정, 기간 설정(startsAt / endsAt) 기능을 지원합니다.

### 💬 메신저 & 길드 채팅

유저 간 쪽지(Message), 길드 초대, 가입 신청 등 알림을 인앱 메신저로 처리합니다. 길드 채팅은 길드 멤버 전용 실시간 채팅방을 제공합니다.

### 🪐 Space Notes

3D 우주 공간에 유저가 남기는 부유 메모 기능. 각 노트는 좌표(posX, posY)를 갖고 공간에 배치됩니다.

### 🏅 프로필 & 배지

Discord 아바타와 핸들이 자동 동기화되는 유저 프로필. Roblox 계정 연동, 방명록(ProfileMessage), 활동 기반으로 획득하는 뱃지 시스템을 포함합니다.

### 🛡️ 어드민 & 매니저 패널

별도 인증 계층이 있는 관리자 페이지. 유저 관리, 공지 작성, 매니저 권한 부여, 행성 노드 내용 수정(PlanetNode)이 가능합니다. 매니저는 카테고리별로 관리 범위(managerScope)를 지정할 수 있습니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 3D 렌더링 | Three.js · React Three Fiber · @react-three/drei |
| 지도 데이터 | TopoJSON · world-atlas |
| 애니메이션 | Framer Motion · GSAP |
| ORM | Prisma |
| 데이터베이스 | PostgreSQL |
| 인증 | NextAuth.js v5 + Discord OAuth 2.0 |
| 스타일 | Tailwind CSS v4 |

---

## 데이터베이스 스키마

Prisma 기반 PostgreSQL 스키마. NextAuth 표준 테이블 위에 커뮤니티 전용 모델이 구성됩니다.

```
User              유저 · 닉네임 · 역할 · 포인트 · 배지
Guild             길드 · 레벨 · XP · 정원
GuildMember       길드 멤버십 (LEADER / SUBLEADER / MEMBER)
GuildChatMessage  길드 채팅
Post              게시판 (FREE / QUESTION / NOTICE / REVIEW)
Comment           댓글 · 대댓글 (self-relation)
Announcement      공지 (NOTICE / EVENT / UPDATE)
AnnComment        공지 댓글 · 매니저 대댓글
Message           인앱 메신저 (초대 · 신청 · 시스템 알림)
Attendance        출석 (userId + date 복합 유니크)
SGCPrice          자체 화폐 시세 기록
UserInventory     아이템 인벤토리
UserBadge         배지 보유 내역
SpaceNote         3D 공간 부유 메모
PlanetNode        행성별 포트폴리오 노드 (어드민 편집)
RobloxLink        Roblox 계정 연동
ProfileMessage    프로필 방명록
```

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                      # 메인 (3D 태양계 + 히어로)
│   ├── api/
│   │   ├── auth/[...nextauth]/       # Discord OAuth (NextAuth)
│   │   ├── guilds/[slug]/            # 길드 CRUD · 채팅 · 기부 · 출석
│   │   ├── announcements/            # 공지 · 댓글 · 대댓글
│   │   ├── discord-points/           # Discord 봇 포인트 조회
│   │   └── admin/                    # 어드민 전용 엔드포인트
│   ├── admin/                        # 어드민 UI
│   └── manager/                      # 매니저 UI
├── components/
│   ├── SolarSystem.tsx               # 3D 태양계 메인 씬
│   ├── SceneCanvas.tsx               # R3F Canvas 래퍼
│   ├── HeroSection.tsx               # 랜딩 히어로
│   ├── FeaturesSection.tsx           # 기능 소개
│   ├── Navigation.tsx                # 글로벌 네비게이션
│   ├── LoadingSequence.tsx           # 초기 로딩 시퀀스
│   └── GlitchOverlay.tsx             # 글리치 비주얼 효과
├── hooks/                            # 공통 커스텀 훅
├── lib/                              # 유틸 · 애니메이션 · 배지 정의
└── types/                            # 공통 타입 정의
```

---

## 환경 변수

```env
DATABASE_URL=          # PostgreSQL 연결 문자열 (Prisma)
DIRECT_URL=            # Prisma Direct URL (커넥션 풀링 우회)
NEXTAUTH_SECRET=       # NextAuth 서명 시크릿
DISCORD_CLIENT_ID=     # Discord OAuth 앱 ID
DISCORD_CLIENT_SECRET= # Discord OAuth 시크릿
DISCORD_BOT_TOKEN=     # 봇 API 조회용 (포인트 연동)
```
