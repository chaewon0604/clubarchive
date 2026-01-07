/* =========================================================
   HASUNG CLUB ARCHIVE - app.js (PHONE FIX + PDF BUTTON)
   - PC/태블릿: PDF를 iframe 미리보기
   - 핸드폰: PDF는 "버튼 눌렀을 때만" 새 탭 열기 (자동 X)
   - 모바일에서 splash 탭이 click으로 안 잡히는 문제 해결:
     pointerup / touchend / click 모두 지원 + "현재 splash면 메뉴로" 방식
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
 * "핸드폰만" 판별:
 * - 화면 폭이 작고
 * - 터치 기반(pointer: coarse)
 * iPad(대부분 768px+)는 제외되는 편.
 */
function isPhone() {
  return (
    window.matchMedia("(max-width: 600px)").matches &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

/**
 * GitHub Pages에서 한글/공백 경로가 깨질 수 있어서 URL-safe 변환
 * (슬래시 구간별 인코딩)
 */
function toSafeUrl(path) {
  if (!path) return "";
  const parts = String(path).split("/").map((seg) => encodeURIComponent(seg));
  let joined = parts.join("/");
  joined = joined.replace(/^https%3A\/\//i, "https://").replace(/^http%3A\/\//i, "http://");
  return joined;
}

function openNewTab(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

/* =============== render =============== */
function renderFile(path) {
  contentFrameWrap.innerHTML = "";
  currentFilePath = path || null;

  if (!path) {
    contentFrameWrap.innerHTML = `<div class="emptyState">자료가 아직 없어요.</div>`;
    return;
  }

  const safe = toSafeUrl(path);

if (isPdf(path) && isPhone()) {
  const absoluteUrl = new URL(safe, window.location.href).href;

  // 구글 PDF 뷰어(페이지 넘김이 더 안정적인 편)
  const gviewUrl =
    "https://docs.google.com/gview?embedded=1&url=" +
    encodeURIComponent(absoluteUrl);

  contentFrameWrap.innerHTML = `
    <div class="emptyState" style="line-height:1.55;">
      핸드폰에서는 일부 PDF(특히 Canva/보고서)가<br/>
      첫 페이지만 보이거나 넘김이 막히는 경우가 있어요.<br/><br/>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="ghost" id="openNativeBtn" type="button">기본 PDF로 열기</button>
        <button class="primary" id="openStableBtn" type="button">페이지 잘 넘기는 뷰어로 열기(추천)</button>
      </div>

      <div style="margin-top:10px; font-size:13px; opacity:.75;">
        추천 버튼은 Google 뷰어로 열려서 넘김이 더 안정적이에요.
      </div>
    </div>
  `;

  document.getElementById("openNativeBtn")?.addEventListener(
    "click",
    () => openNewTab(absoluteUrl),
    { passive: true }
  );

  document.getElementById("openStableBtn")?.addEventListener(
    "click",
    () => openNewTab(gviewUrl),
    { passive: true }
  );

  return;
}


  //  PC/태블릿: PDF iframe 미리보기
  if (isPdf(path)) {
    const iframe = document.createElement("iframe");
    iframe.className = "pdfFrame";
    iframe.loading = "lazy";
    iframe.title = "PDF 미리보기";
    iframe.src = safe + "#view=FitH";
    contentFrameWrap.appendChild(iframe);
    return;
  }

  // PDF 외 자료
  contentFrameWrap.innerHTML = `
    <div class="emptyState">
      이 자료는 내부 미리보기를 지원하지 않아요.<br/>
      아래 버튼으로 새 탭에서 열어주세요.
      <div style="margin-top:12px;">
        <button class="ghost" id="openExternalBtn" type="button">새 탭으로 열기</button>
      </div>
    </div>
  `;
  document.getElementById("openExternalBtn")?.addEventListener(
    "click",
    () => openNewTab(safe),
    { passive: true }
  );
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

/* =============== navigation events =============== */
/**
 * ✅ 폰에서 "첫 화면만 나오고 안 넘어감" 해결 포인트:
 * section 클릭만 믿지 말고, 문서 전체에서
 * "현재 splash가 active면 탭하면 menu로" 처리.
 */
function goMenuIfSplashActive() {
  if (screens.splash?.classList.contains("active")) {
    showScreen("menu");
  }
}

// splash 영역을 탭해도 되고
screens.splash?.addEventListener("click", goMenuIfSplashActive, { passive: true });

// 모바일에서 click이 안 잡히는 경우 대비: pointer/touch도 추가
document.addEventListener("pointerup", goMenuIfSplashActive, { passive: true });
document.addEventListener("touchend", goMenuIfSplashActive, { passive: true });

btnHome?.addEventListener("click", () => showScreen("splash"), { passive: true });
btnHome2?.addEventListener("click", () => showScreen("splash"), { passive: true });
btnBack?.addEventListener("click", () => showScreen("menu"), { passive: true });

/* =============== start =============== */
loadClubs().catch((err) => {
  console.error(err);
  alert("clubs.json을 불러오지 못했어요. (GitHub Pages 또는 Live Server 확인)");
});

initFloatingLogos();
