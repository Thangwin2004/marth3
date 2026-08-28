const STORAGE_KEY = "winkgames:bo-lac-crush:language";
const SUPPORTED_LANGUAGES = Object.freeze(["en", "vi"]);

const messages = {
  en: {
    "game.title": "TRIBE\nCRUSH",
    "game.documentTitle": "Tribe Crush - Match 3",
    "loading.progress": "LOADING {progress}%",
    "menu.play": "PLAY NOW",
    "menu.member": "Member",
    "menu.guest": "Guest",
    "menu.googleLogin": "SIGN IN WITH GOOGLE",
    "leaderboard.title": "LEADERBOARD",
    "leaderboard.accountSignedIn": "Account: {name} (Signed in)",
    "leaderboard.memberSignedIn": "Account: Member (Signed in)",
    "leaderboard.signInToSave": "Sign in to Wink to save your score",
    "leaderboard.offline": "Offline (using device data)",
    "leaderboard.rankHeader": "RANK",
    "leaderboard.memberHeader": "PLAYER",
    "leaderboard.scoreHeader": "SCORE",
    "leaderboard.empty":
      "No scores yet.<br/>Play now and set the first record! 🚀",
    "leaderboard.defaultMember": "Player",
    "leaderboard.defaultMemberNumber": "Player #{rank}",
    "leaderboard.youGuest": "You (Guest)",
    "leaderboard.rank": "Rank: #{rank}",
    "leaderboard.noRank": "Rank: —",
    "leaderboard.score": "Score: {score}",
    "leaderboard.noScore": "Score: —",
    "settings.title": "SETTINGS",
    "settings.pauseTitle": "PAUSED",
    "settings.music": "MUSIC",
    "settings.sfx": "SOUND FX",
    "settings.language": "LANGUAGE",
    "settings.version": "Version: 1.0.0",
    "settings.english": "English",
    "settings.vietnamese": "Tiếng Việt",
    "actions.home": "Home",
    "actions.replay": "Replay",
    "actions.continue": "Continue",
    "actions.confirm": "Confirm",
    "actions.cancel": "Cancel",
    "tutorial.swap": "Tap 2 animals or swipe to swap",
    "debug.complete": "TEST END",
    "revive.title": "CONTINUE?",
    "revive.moreMoves": "EXTRA MOVES",
    "revive.skip": "No, thanks",
    "result.end": "GAME OVER",
    "result.newRecord": "NEW RECORD",
    "result.newRecordRank": "NEW RECORD  ·  #{rank}",
    "result.best": "BEST  ·  {score}",
    "result.signIn": "SIGN IN TO SAVE",
    "result.device": "DEVICE  ·  {score}",
    "result.goodRun": "GREAT RUN!",
    "result.totalScore": "TOTAL SCORE:\n{score}",
    "result.tryAgain": "Better luck on your next run!",
    "result.doubled": "Your score has been doubled!",
    "deadlock.shuffle": "NO MOVES!\nSHUFFLING THE BOARD...",
    "combo.superRainbow": "SUPER RAINBOW STORM! 🌈",
    "combo.rainDrum": "BRONZE DRUM RAIN! 🥁",
    "combo.rainRune": "RUNE CROSS STORM! ⚡",
    "combo.giantDrum": "GIANT BRONZE DRUM BLAST! 💥",
    "combo.crossGrid": "SUPER CROSS GRID! ⚔️",
    "combo.fireworks": "CHAIN FIREWORKS! 🎆",
    "combo.superFusion": "SUPER FUSION! +{score}",
    "combo.superDrum": "SUPER BRONZE DRUM! +{score}{multiplier}",
    "combo.superCross": "SUPER CROSS! +{score}{multiplier}",
    "combo.superBlast": "SUPER BLAST! +{score}{multiplier}",
    "combo.drum": "BRONZE DRUM! +{score}{multiplier}",
    "combo.match4": "MATCH 4! +{score}{multiplier}",
    "combo.match5": "MATCH 5! +{score}{multiplier}",
    "combo.thunderDrum": "THUNDER DRUM! +{score}{multiplier}",
    "combo.crossEffect": "CROSS BLAST! +{score}{multiplier}",
    "combo.rainbowBlast": "RAINBOW BLAST! +{score}{multiplier}",
  },
  vi: {
    "game.title": "BỘ LẠC\nCRUSH",
    "game.documentTitle": "Bộ Lạc Crush - Match 3",
    "loading.progress": "ĐANG TẢI {progress}%",
    "menu.play": "CHƠI NGAY",
    "menu.member": "Thành viên",
    "menu.guest": "Khách",
    "menu.googleLogin": "ĐĂNG NHẬP GOOGLE",
    "leaderboard.title": "BẢNG VÀNG",
    "leaderboard.accountSignedIn": "Tài khoản: {name} (Đã đăng nhập)",
    "leaderboard.memberSignedIn": "Tài khoản: Thành viên (Đã đăng nhập)",
    "leaderboard.signInToSave": "Đăng nhập Wink để lưu thành tích",
    "leaderboard.offline": "Ngoại tuyến (đang dùng dữ liệu thiết bị)",
    "leaderboard.rankHeader": "HẠNG",
    "leaderboard.memberHeader": "THÀNH VIÊN",
    "leaderboard.scoreHeader": "ĐIỂM SỐ",
    "leaderboard.empty":
      "Chưa có thành tích nào.<br/>Hãy chơi game để thiết lập kỷ lục nhé! 🚀",
    "leaderboard.defaultMember": "Thành viên",
    "leaderboard.defaultMemberNumber": "Thành viên #{rank}",
    "leaderboard.youGuest": "Bạn (Khách)",
    "leaderboard.rank": "Hạng: #{rank}",
    "leaderboard.noRank": "Hạng: —",
    "leaderboard.score": "Điểm: {score}",
    "leaderboard.noScore": "Điểm: —",
    "settings.title": "CÀI ĐẶT",
    "settings.pauseTitle": "TẠM DỪNG",
    "settings.music": "ÂM NHẠC",
    "settings.sfx": "HIỆU ỨNG",
    "settings.language": "NGÔN NGỮ",
    "settings.version": "Phiên bản: 1.0.0",
    "settings.english": "English",
    "settings.vietnamese": "Tiếng Việt",
    "actions.home": "Về trang chính",
    "actions.replay": "Chơi lại",
    "actions.continue": "Tiếp tục",
    "actions.confirm": "Đồng ý",
    "actions.cancel": "Hủy",
    "tutorial.swap": "Chạm 2 thú hoặc vuốt để đổi chỗ",
    "debug.complete": "TEST XONG",
    "revive.title": "TIẾP TỤC?",
    "revive.moreMoves": "THÊM LƯỢT",
    "revive.skip": "Không, cảm ơn",
    "result.end": "KẾT THÚC",
    "result.newRecord": "KỶ LỤC MỚI",
    "result.newRecordRank": "KỶ LỤC MỚI  ·  #{rank}",
    "result.best": "CAO NHẤT  ·  {score}",
    "result.signIn": "ĐĂNG NHẬP ĐỂ LƯU",
    "result.device": "THIẾT BỊ  ·  {score}",
    "result.goodRun": "CHƠI TỐT LẮM!",
    "result.totalScore": "TỔNG ĐIỂM:\n{score}",
    "result.tryAgain": "Hãy cố gắng hơn ở lượt chơi kế tiếp nhé!",
    "result.doubled": "Điểm đã được nhân đôi!",
    "deadlock.shuffle": "HẾT NƯỚC ĐI!\nĐANG TRÁO BÀN NGỌC...",
    "combo.superRainbow": "SIÊU BÃO CẦU VỒNG! 🌈",
    "combo.rainDrum": "CƠN MƯA TRỐNG ĐỒNG! 🥁",
    "combo.rainRune": "BÃO CHỮ THẬP RUNE! ⚡",
    "combo.giantDrum": "ĐẠI TRỐNG ĐỒNG PHÁT NỔ! 💥",
    "combo.crossGrid": "SIÊU LƯỚI CHỮ THẬP! ⚔️",
    "combo.fireworks": "PHÁO HOA LIÊN HOÀN! 🎆",
    "combo.superFusion": "SIÊU PHỐI HỢP! +{score}",
    "combo.superDrum": "SIÊU TRỐNG ĐỒNG! +{score}{multiplier}",
    "combo.superCross": "SIÊU CHỮ THẬP! +{score}{multiplier}",
    "combo.superBlast": "SIÊU BÃO NỔ! +{score}{multiplier}",
    "combo.drum": "TRỐNG ĐỒNG! +{score}{multiplier}",
    "combo.match4": "KẾT HỢP 4! +{score}{multiplier}",
    "combo.match5": "KẾT HỢP 5! +{score}{multiplier}",
    "combo.thunderDrum": "SẤM VANG TRỐNG ĐỒNG! +{score}{multiplier}",
    "combo.crossEffect": "HIỆU ỨNG CHỮ THẬP! +{score}{multiplier}",
    "combo.rainbowBlast": "NỔ SẮC CẦU VỒNG! +{score}{multiplier}",
  },
};

function normalizeLanguage(value) {
  if (typeof value !== "string") return null;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : null;
}

function readStoredLanguage() {
  try {
    return normalizeLanguage(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function readUrlLanguage() {
  try {
    const params = new window.URLSearchParams(window.location.search);
    return normalizeLanguage(
      params.get("locale") || params.get("lang") || params.get("language"),
    );
  } catch {
    return null;
  }
}

function readBrowserLanguage() {
  const candidates = [
    ...(globalThis.navigator?.languages || []),
    globalThis.navigator?.language,
  ];
  return candidates.map(normalizeLanguage).find(Boolean) || "en";
}

function readWinkLanguage(state) {
  return normalizeLanguage(
    state?.locale ||
      state?.language ||
      state?.preferences?.language ||
      state?.preferences?.locale,
  );
}

class I18nManager {
  constructor() {
    this.hasLocalOverride = Boolean(readStoredLanguage());
    this.language =
      readStoredLanguage() ||
      readUrlLanguage() ||
      readBrowserLanguage() ||
      "en";
    this.listeners = new Set();
    this.applyDocumentLanguage();
  }

  applyDocumentLanguage() {
    if (globalThis.document?.documentElement) {
      document.documentElement.lang = this.language;
      document.title = this.t("game.documentTitle");
    }
  }

  setLanguage(language, { persist = true } = {}) {
    const normalized = normalizeLanguage(language) || "en";
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, normalized);
        this.hasLocalOverride = true;
      } catch {
        // The selected language still applies for this session.
      }
    }
    if (normalized === this.language) return false;
    this.language = normalized;
    this.applyDocumentLanguage();
    for (const listener of this.listeners) listener(normalized);
    return true;
  }

  syncFromWink(state) {
    if (this.hasLocalOverride) return false;
    const platformLanguage = readWinkLanguage(state) || readUrlLanguage();
    if (!platformLanguage) return false;
    return this.setLanguage(platformLanguage, { persist: false });
  }

  t(key, variables = {}) {
    const template = messages[this.language]?.[key] ?? messages.en[key] ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_, name) =>
      variables[name] === undefined || variables[name] === null
        ? `{${name}}`
        : String(variables[name]),
    );
  }

  formatNumber(value) {
    const locale = this.language === "vi" ? "vi-VN" : "en-US";
    return Number(value || 0).toLocaleString(locale);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const i18n = new I18nManager();
export const t = (key, variables) => i18n.t(key, variables);
export { SUPPORTED_LANGUAGES };
