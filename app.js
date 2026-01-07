/* =========================================================
   HASUNG CLUB ARCHIVE - app.js (CLEAN)
   - Kiosk/Demo/Auto-return 제거
   - PDF: iframe 미리보기(오른쪽/아래)
   - Mobile(세로): 위 목록 + 아래 PDF(스크롤)
========================================================= */

const screens = {
  splash: document.getElementById("screen-splash"),
  menu: document.getElementById("screen-menu"),
  club: document.getElementById("screen-club"),
};

const menuButtons = document.getElementById("menuButtons");
const btnHome = document.getElementById("btnHome");
const btnHome2 = document.getElementById("btnHome2");
const btnBack = document.getElementById("btnBack");

const clubTitle = document.getElementById("clubTitle");
const clubLogo = document.getElementById("clubLogo");
const clubName = document.getElementById("clubName");
const clubDesc = document.getElementById("clubDesc");

const fileListEl = document.getElementById("fileList");
const contentFrameWrap = document.getElementById("contentFrameWrap");
const btnOpenNewTab = document.getElementById("btnOpenNewTab");

/* state */
let clubsCache = [];
let currentClub = null;
let currentFilePath = null;

/* =============== utils =============== */
function showScreen(name) {
  Object.values(screens).forEach((s) => s?.classList.remove("active"));
  screens[name]?.classList.add("active");
}

function isPdf(path) {
  return (path || "").toLowerCase().endsWith(".pdf");
}

/**
 * GitHub Pages에서 "한글/공백" 경로가 iframe에서 깨지는 경우가 있어
 * path를 URL-safe로 변환해줌.
 * - 슬래시(/)는 유지하고 각 구간만 encodeURIComponent
 */
function toSafeUrl(path) {
  if (!path) return "";
  // 이미 http(s)인 경우도 구간별 인코딩이 필요할 수 있어 동일 처리
  const parts = String(path).split("/").map((seg) => encodeURIComponent(seg));
  // encodeURIComponent는 ":" 도 인코딩하니까 http:// 같은 경우가 깨짐 → 되돌리기
  // "http%3A%2F%2F" 형태면 원래대로 복원
  let joined = parts.join("/");
  joined = joined.replace(/^https%3A\/\//i, "https://").replace(/^http%3A\/\//i, "http://");
  return joined;
}

function openNewTab(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

/* =============== render PDF =============== */
function renderFile(path) {
  contentFrameWrap.innerHTML = "";
  currentFilePath = path || null;

  if (!path) {
    contentFrameWrap.innerHTML = `<div class="emptyState">자료가 아직 없어요.</div>`;
    return;
  }

  // PDF는 iframe으로 미리보기
  if (isPdf(path)) {
    const iframe = document.createElement("iframe");
    iframe.className = "pdfFrame";
    iframe.loading = "lazy";
    iframe.title = "PDF 미리보기";

    const safe = toSafeUrl(path);
    iframe.src = safe + "#view=FitH"; // 확대 완화(브라우저에 따라 무시될 수도 있음)

    contentFrameWrap.appendChild(iframe);
    return;
  }

  // PDF가 아닌 경우(혹시 링크 등): 안내 + 새탭
  contentFrameWrap.innerHTML = `
    <div class="emptyState">
      이 자료는 내부 미리보기를 지원하지 않아요.<br/>
      아래 버튼으로 새 탭에서 열어주세요.
      <div style="margin-top:12px;">
        <button class="ghost" id="openExternalBtn" type="button">새 탭으로 열기</button>
      </div>
    </div>
  `;

  const btn = document.getElementById("openExternalBtn");
  btn?.addEventListener("click", () => openNewTab(toSafeUrl(path)), { passive: true });
}

/* =============== file list =============== */
function renderFileList(files) {
  fileListEl.innerHTML = "";

  if (!Array.isArray(files) || files.length === 0) {
    fileListEl.innerHTML = `<div class="fileListEmpty">등록된 자료가 없어요.</div>`;
    renderFile(null);
    return;
  }

  files.forEach((f, idx) => {
    const b = document.createElement("button");
    b.className = "fileBtn";
    b.type = "button";
    b.textContent = f.title || `자료 ${idx + 1}`;

    b.addEventListener(
      "click",
      () => {
        [...fileListEl.querySelectorAll(".fileBtn")].forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        renderFile(f.path);
      },
      { passive: true }
    );

    fileListEl.appendChild(b);

    // 첫 파일 자동 선택
    if (idx === 0) {
      b.classList.add("active");
      renderFile(f.path);
    }
  });
}

/* =============== menu =============== */
function renderMenu(clubs) {
  menuButtons.innerHTML = "";

  clubs.forEach((club) => {
    const btn = document.createElement("button");
    btn.type = "button";

    const safeId = String(club.id || "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-");

    btn.className = `clubBtn club-${safeId}`;
    btn.innerHTML = `
      <div class="name">${club.name || club.id}</div>
      <div class="sub">${club.desc || ""}</div>
    `;

    btn.addEventListener("click", () => openClub(club), { passive: true });
    menuButtons.appendChild(btn);
  });
}

/* =============== open club =============== */
function openClub(club) {
  currentClub = club;

  // 테마 유지(원래 너가 쓰던 A/B)
  screens.club.classList.remove("theme-A", "theme-B");
  if (club.id === "logicode" || club.id === "로직코드") screens.club.classList.add("theme-A");
  if (club.id === "mm" || club.id === "M&M") screens.club.classList.add("theme-B");

  clubTitle.textContent = club.name || club.id;
  clubName.textContent = club.name || club.id;
  clubDesc.textContent = club.desc || "";

  if (club.logo) {
    clubLogo.src = toSafeUrl(club.logo);
    clubLogo.style.display = "";
  } else {
    clubLogo.removeAttribute("src");
    clubLogo.style.display = "none";
  }
  clubLogo.alt = `${club.name || club.id} 로고`;

  const files = Array.isArray(club.files) ? club.files : [];
  renderFileList(files);

  // 새 탭 열기(보험 버튼)
  btnOpenNewTab.onclick = () => {
    if (!currentFilePath) return;
    openNewTab(toSafeUrl(currentFilePath));
  };

  showScreen("club");
}

/* =============== data load =============== */
async function loadClubs() {
  const res = await fetch("clubs.json", { cache: "no-store" });
  if (!res.ok) throw new Error("clubs.json fetch failed");
  const data = await res.json();
  clubsCache = data.clubs || [];
  renderMenu(clubsCache);
}

/* =============== splash floating logos =============== */
const floatingLogos = [
  "assets/clubs/로직코드.png",
  "assets/clubs/M&M.png",
  "assets/clubs/prism.png",
  "assets/clubs/vitalis.png",
];

function initFloatingLogos() {
  const wrap = document.getElementById("floating-logos");
  if (!wrap) return;

  wrap.innerHTML = "";
  const count = 12;

  for (let i = 0; i < count; i++) {
    const img = document.createElement("img");
    img.src = toSafeUrl(floatingLogos[i % floatingLogos.length]);
    img.className = "floating-logo";
    img.alt = "";

    img.style.left = Math.random() * 100 + "vw";
    img.style.animationDuration = 20 + Math.random() * 20 + "s";
    img.style.animationDelay = -Math.random() * 20 + "s";

    wrap.appendChild(img);
  }
}

/* =============== events =============== */
screens.splash.addEventListener("click", () => showScreen("menu"), { passive: true });
btnHome.addEventListener("click", () => showScreen("splash"), { passive: true });
btnHome2.addEventListener("click", () => showScreen("splash"), { passive: true });
btnBack.addEventListener("click", () => showScreen("menu"), { passive: true });

/* =============== start =============== */
loadClubs().catch((err) => {
  console.error(err);
  alert("clubs.json을 불러오지 못했어요. (GitHub Pages 또는 Live Server 확인)");
});

initFloatingLogos();
