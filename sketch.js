// 設定 Google Sheets 發布 CSV 網址，請將這段文字替換成實際網址。
const GOOGLE_SHEET_CSV_URL = "請替換成你的 Google Sheets 發布 CSV 網址";
// 設定畫布背景顏色。
const CANVAS_BACKGROUND = "#ffc8dd";
// 設定題目背景顏色。
const QUESTION_BACKGROUND = "#cdb4db";
// 設定尚未作答選項的背景顏色。
const OPTION_BACKGROUND = "#ffffff";
// 設定答對選項的背景顏色。
const CORRECT_BACKGROUND = "#fee440";
// 設定答錯選項的背景顏色。
const WRONG_BACKGROUND = "#ff0054";
// 設定主要 Google 字型名稱。
const FONT_FAMILY = 'LXGW WenKai Mono TC';
// 設定 Google 字型載入失敗時使用的備援字型。
const FALLBACK_FONT_FAMILY = 'Noto Sans TC, Microsoft JhengHei, sans-serif';
// 設定 document.fonts.load 使用的安全字型請求字串，避免引號未閉合。
const FONT_REQUEST = '16px "LXGW WenKai Mono TC"';
// 設定備援字型的安全 Canvas font 請求字串。
const FALLBACK_FONT_REQUEST = '16px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
// 設定 Canvas CSS 字型值，保留主要字型與 serif 備援。
const FONT_CSS_VALUE = '"LXGW WenKai Mono TC", serif';
// 設定每次測驗固定抽出的題目數量。
const QUIZ_LENGTH = 5;
// 設定 Google Sheets CSV 必須存在的欄位名稱。
const REQUIRED_COLUMNS = ["passage", "question", "optionA", "optionB", "optionC", "optionD", "answer"];
// 儲存完整題庫資料。
let questionBank = [];
// 儲存目前測驗抽出的題目。
let quizQuestions = [];
// 儲存目前顯示的題目索引。
let currentQuestionIndex = 0;
// 儲存目前測驗答對的題數。
let score = 0;
// 儲存目前選取的選項索引，尚未作答時為負一。
let selectedOption = -1;
// 儲存目前題目的正確選項索引。
let correctOption = -1;
// 儲存目前畫面狀態。
let screenState = "loading";
// 儲存外部題庫錯誤訊息。
let dataErrorMessage = "";
// 儲存題庫是否正在載入。
let dataIsLoading = true;
// 儲存 Google 字型是否已準備完成。
let preferredFontReady = false;
// 儲存響應式版面資料。
let layout = {};
// 儲存最近一次觸控時間。
let lastTouchTime = 0;
// 儲存煙火粒子資料。
let fireworks = [];
// 儲存煙火開始時間。
let fireworksStartedAt = 0;
// 儲存請加油動畫開始時間。
let encouragementStartedAt = 0;
// 儲存目前最新一次題庫載入的編號。
let questionLoadToken = 0;
// 定義至少五題的內建備援題庫。
const fallbackQuestions = [
  { passage: "小河邊住著一隻小螞蟻。每天早晨，牠都會把掉在路旁的米粒搬回家。有一天，米粒被大風吹到水邊，小螞蟻找來一片樹葉，把米粒放在樹葉上，再慢慢拉回洞裡。", question: "小螞蟻平常把什麼東西搬回家？", optionA: "花瓣", optionB: "米粒", optionC: "石頭", optionD: "樹枝", answer: 1 },
  { passage: "小晴種了一盆薄荷。她每天早晚各澆一次水，還把盆栽放在窗邊，讓它曬到陽光。幾個星期後，薄荷長出許多嫩綠的葉子，小晴摘下一片放進茶裡，聞到清新的香味。", question: "小晴把薄荷盆栽放在哪裡？", optionA: "窗邊", optionB: "床下", optionC: "櫃子裡", optionD: "門後", answer: 0 },
  { passage: "森林裡舉辦分享會，松鼠帶來香甜的栗子，兔子帶來新鮮的紅蘿蔔，刺蝟則帶來自己種的草莓。大家把食物放在一起，先請年紀最大的梅花鹿取用，最後一起開心地享用。", question: "分享會中，誰帶來了草莓？", optionA: "松鼠", optionB: "兔子", optionC: "刺蝟", optionD: "梅花鹿", answer: 2 },
  { passage: "下雨天時，雨水落到屋頂，再沿著水管流進水桶。小安把收集到的雨水拿來澆花、沖洗陽台，這樣不但能節省自來水，也能讓雨水得到再次利用。", question: "小安用收集到的雨水做什麼事情？", optionA: "煮湯", optionB: "澆花和沖洗陽台", optionC: "洗衣服", optionD: "餵魚", answer: 1 },
  { passage: "校園裡有一棵老榕樹，樹下常常很涼快。午休時，同學們喜歡坐在樹下閱讀。為了保護老榕樹，大家不在樹幹上刻字，也會把落葉集中起來做成堆肥。", question: "同學們如何保護老榕樹？", optionA: "在樹幹上刻名字", optionB: "把樹枝折下來", optionC: "不刻字並利用落葉製作堆肥", optionD: "每天爬到樹上玩", answer: 2 }
];

// p5.js 建立畫布後執行初始化工作。
function setup() {
  // 建立覆蓋視窗的響應式畫布。
  createCanvas(windowWidth, windowHeight);
  // 取得畫布元素並設定無障礙標籤。
  const canvasElement = document.querySelector("canvas");
  // 確認畫布元素存在後設定標籤。
  if (canvasElement) {
    canvasElement.setAttribute("aria-label", "國小閱讀理解小測驗");
  }
  // 設定文字水平與垂直對齊方式。
  textAlign(CENTER, CENTER);
  // 設定矩形使用左上角座標。
  rectMode(CORNER);
  // 立即套用可用字型，避免字型載入阻塞畫面。
  applyCanvasFont();
  // 依目前視窗尺寸計算版面。
  updateLayout();
  // 背景載入 Google 字型，不阻塞測驗文字繪製。
  loadFontWithoutBlocking();
  // 非阻塞地讀取 Google Sheets 題庫。
  loadQuestionBank();
}

// p5.js 每一幀繪製目前畫面。
function draw() {
  // 使用指定背景色清除畫布。
  background(CANVAS_BACKGROUND);
  // 每一幀套用可用字型，確保中文字能夠繪製。
  applyCanvasFont();
  // 每一幀重新計算響應式版面。
  updateLayout();
  // 依據畫面狀態繪製內容。
  if (screenState === "loading") {
    // 顯示題庫載入畫面。
    drawLoadingScreen();
  } else if (screenState === "quiz") {
    // 顯示作答畫面。
    drawQuizScreen();
  } else if (screenState === "finished") {
    // 顯示完成與成績畫面。
    drawFinishedScreen();
  }
}

// 在背景檢查 Google 字型，並且不讓字型網路問題阻塞畫面。
function loadFontWithoutBlocking() {
  // 確認瀏覽器支援 Font Loading API。
  if (document.fonts && typeof document.fonts.load === "function") {
    // 使用預先定義且引號完整的字型請求，避免動態拼接造成語法錯誤。
    document.fonts.load(FONT_REQUEST).then(function() {
      // 記錄指定字型已完成載入。
      preferredFontReady = true;
      // 立即套用完成的字型。
      applyCanvasFont();
    }).catch(function() {
      // 字型失敗時保留備援策略。
      preferredFontReady = false;
      // 立即套用備援字型。
      applyCanvasFont();
    });
  }
}

// 設定 p5.js 與原生 Canvas 的字型。
function applyCanvasFont() {
  // 字型載入完成時使用主要字型，失敗時改用固定備援字型。
  const activeFont = preferredFontReady ? FONT_FAMILY : FALLBACK_FONT_FAMILY;
  // 將安全的字型名稱套用到 p5.js。
  textFont(activeFont);
  // 確認原生 Canvas 內容也使用安全的字型請求。
  if (typeof drawingContext !== "undefined") {
    // 選擇預先定義的字型請求，避免動態拼接引號。
    const fontRequest = preferredFontReady ? FONT_REQUEST : FALLBACK_FONT_REQUEST;
    // 設定原生 Canvas 的測量字型。
    drawingContext.font = fontRequest;
  }
}

// 取得設定中的 Google Sheets CSV 網址。
function getGoogleSheetCsvUrl() {
  // 優先讀取 index.html 的 window 設定。
  const htmlUrl = typeof window !== "undefined" ? window.GOOGLE_SHEET_CSV_URL : "";
  // 將 HTML 設定轉成安全字串並移除前後空白。
  const normalizedHtmlUrl = typeof htmlUrl === "string" ? htmlUrl.trim() : "";
  // HTML 有有效網址時優先回傳 HTML 設定。
  if (normalizedHtmlUrl && normalizedHtmlUrl !== "請替換成你的 Google Sheets 發布 CSV 網址") {
    // 回傳 index.html 設定的網址。
    return normalizedHtmlUrl;
  }
  // 讀取 sketch.js 頂端的設定。
  const normalizedSketchUrl = typeof GOOGLE_SHEET_CSV_URL === "string" ? GOOGLE_SHEET_CSV_URL.trim() : "";
  // sketch.js 有效網址時回傳該網址。
  if (normalizedSketchUrl && normalizedSketchUrl !== "請替換成你的 Google Sheets 發布 CSV 網址") {
    // 回傳 sketch.js 設定的網址。
    return normalizedSketchUrl;
  }
  // 沒有替換設定時回傳空字串。
  return "";
}

// 建立不使用快取的 Google Sheets CSV 請求網址。
function buildFreshCsvUrl(baseUrl) {
  // 使用目前時間建立查詢參數。
  const timestamp = "_t=" + Date.now();
  // 根據原網址是否已有查詢參數決定連接符號。
  const separator = baseUrl.indexOf("?") >= 0 ? "&" : "?";
  // 回傳附加時間戳的網址。
  return baseUrl + separator + timestamp;
}

// 載入外部 Google Sheets 題庫。
function loadQuestionBank() {
  // 為本次載入建立唯一編號，避免舊請求覆蓋新資料。
  questionLoadToken += 1;
  // 保存本次請求的編號。
  const currentLoadToken = questionLoadToken;
  // 取得優先順序處理後的 CSV 網址。
  const csvUrl = getGoogleSheetCsvUrl();
  // 顯示正在載入狀態。
  dataIsLoading = true;
  // 將畫面切換至載入狀態，但仍會繪製粉紅背景與載入文字。
  screenState = "loading";
  // 顯示 HTML 載入提示。
  setPageLoadingVisibility(true, "題庫載入中，請稍候");
  // 尚未設定網址時直接啟用備援題庫。
  if (!csvUrl) {
    // 設定清楚的繁體中文錯誤訊息。
    useFallbackQuestions("尚未設定 Google Sheets CSV 網址，已使用內建備援題庫。請確認試算表已「發布到網路」且網址為 CSV 格式。");
    // 結束本次載入流程。
    return;
  }
  // 使用 fetch 讀取附加時間戳的最新 CSV。
  fetch(buildFreshCsvUrl(csvUrl), { cache: "no-store" })
    .then(function(response) {
      // HTTP 狀態不是成功時主動拋出錯誤。
      if (!response.ok) {
        // 將 HTTP 狀態轉成錯誤內容。
        throw new Error("HTTP " + response.status);
      }
      // 以文字形式讀取完整 UTF-8 CSV。
      return response.text();
    })
    .then(function(csvText) {
      // 若已有更新的載入請求，忽略這次舊回應。
      if (currentLoadToken !== questionLoadToken) {
        // 結束舊請求處理。
        return;
      }
      // 解析含有 BOM、中文、逗號、引號與換行的 CSV。
      const parsedQuestions = parseQuestionsCsv(csvText);
      // 題數少於五題時視為資料格式錯誤。
      if (parsedQuestions.length < QUIZ_LENGTH) {
        // 主動進入備援題庫流程。
        throw new Error("有效題目少於五題");
      }
      // 保存 Google Sheets 的有效題庫。
      questionBank = parsedQuestions;
      // 清除舊的錯誤提示。
      dataErrorMessage = "";
      // 關閉載入提示。
      dataIsLoading = false;
      // 隱藏 HTML 載入文字。
      setPageLoadingVisibility(false, "");
      // 從最新題庫洗牌並抽出五題。
      startNewQuiz();
    })
    .catch(function(error) {
      // 舊請求的錯誤不可以覆蓋目前的新請求。
      if (currentLoadToken !== questionLoadToken) {
        // 結束舊請求處理。
        return;
      }
      // 網路、未公開、網址錯誤與格式錯誤都使用備援題庫。
      useFallbackQuestions("Google Sheets 題庫載入失敗，已使用內建備援題庫。請確認試算表已「發布到網路」且網址為 CSV 格式。");
      // 將技術錯誤寫入主控台供除錯。
      console.warn("Google Sheets CSV 載入失敗：", error);
    });
}

// 使用內建備援題庫並讓測驗仍然可以完整操作。
function useFallbackQuestions(message) {
  // 複製備援題目，避免洗牌時改動常數資料。
  questionBank = fallbackQuestions.map(function(item) { return Object.assign({}, item); });
  // 保存給使用者看的錯誤訊息。
  dataErrorMessage = message;
  // 結束載入狀態。
  dataIsLoading = false;
  // 隱藏 HTML 載入提示。
  setPageLoadingVisibility(false, "");
  // 仍然啟動五題測驗。
  startNewQuiz();
}

// 控制 HTML 載入提示的顯示與文字。
function setPageLoadingVisibility(visible, message) {
  // 取得頁面上的載入提示元素。
  const loadingElement = document.getElementById("page-loading");
  // 元素不存在時直接結束。
  if (!loadingElement) {
    // 結束元素處理。
    return;
  }
  // 更新載入提示文字。
  loadingElement.textContent = message || "";
  // 依照狀態顯示或隱藏提示。
  loadingElement.style.display = visible ? "flex" : "none";
}

// 解析完整 CSV，支援 UTF-8 BOM、中文、逗號、引號與欄位內換行。
function parseQuestionsCsv(csvText) {
  // 移除檔案開頭的 UTF-8 BOM。
  const cleanCsvText = String(csvText || "").replace(/^\uFEFF/, "");
  // 儲存所有解析出的資料列。
  const rows = [];
  // 儲存目前資料列的欄位。
  let row = [];
  // 儲存目前正在讀取的欄位文字。
  let field = "";
  // 記錄目前是否在引號欄位內。
  let insideQuotes = false;
  // 逐字解析 CSV 內容。
  for (let index = 0; index < cleanCsvText.length; index += 1) {
    // 取得目前字元。
    const character = cleanCsvText[index];
    // 取得下一個字元以判斷跳脫引號。
    const nextCharacter = cleanCsvText[index + 1];
    // 引號欄位中的連續雙引號代表一個雙引號文字。
    if (character === "\"") {
      // 處理引號結束或連續引號。
      if (insideQuotes && nextCharacter === "\"") {
        // 將跳脫後的雙引號加入欄位。
        field += "\"";
        // 跳過下一個已經處理的引號。
        index += 1;
      } else {
        // 切換是否位於引號欄位。
        insideQuotes = !insideQuotes;
      }
    // 非引號欄位中的逗號代表欄位結束。
    } else if (character === "," && !insideQuotes) {
      // 將目前欄位加入資料列。
      row.push(field);
      // 清空下一個欄位的暫存文字。
      field = "";
    // 非引號欄位中的換行代表資料列結束。
    } else if ((character === "\n" || character === "\r") && !insideQuotes) {
      // 處理 Windows 的 CRLF 換行。
      if (character === "\r" && nextCharacter === "\n") {
        // 跳過 CRLF 中的 LF。
        index += 1;
      }
      // 將最後欄位加入目前資料列。
      row.push(field);
      // 保存完成的資料列。
      rows.push(row);
      // 建立下一個空資料列。
      row = [];
      // 清空下一列開始前的欄位文字。
      field = "";
    } else {
      // 將一般字元加入目前欄位。
      field += character;
    }
  }
  // 補上檔案尾端尚未由換行結束的資料。
  if (field.length > 0 || row.length > 0) {
    // 加入最後欄位。
    row.push(field);
    // 加入最後資料列。
    rows.push(row);
  }
  // 沒有資料列時回傳空陣列。
  if (rows.length === 0) {
    // 回傳沒有題目的結果。
    return [];
  }
  // 取得清除 BOM 與空白後的欄位名稱。
  const headers = rows[0].map(function(header) { return String(header).replace(/^\uFEFF/, "").trim(); });
  // 確認固定欄位全部存在。
  const hasAllColumns = REQUIRED_COLUMNS.every(function(column) { return headers.indexOf(column) >= 0; });
  // 欄位不完整時回傳空陣列。
  if (!hasAllColumns) {
    // 讓外層流程顯示格式錯誤並啟用備援題庫。
    return [];
  }
  // 將每個資料列依照標題名稱轉成題目物件。
  return rows.slice(1).map(function(values) {
    // 建立單題資料物件。
    const item = {};
    // 逐一依欄位名稱保存資料。
    headers.forEach(function(header, columnIndex) {
      // 保存欄位內容並移除頭尾空白。
      item[header] = String(values[columnIndex] === undefined ? "" : values[columnIndex]).trim();
    });
    // 將 answer 轉換為數字索引。
    item.answer = Number(item.answer);
    // 回傳清理後的題目物件。
    return item;
  }).filter(function(item) {
    // 確認文字欄位與答案索引全部有效。
    return item.passage && item.question && item.optionA && item.optionB && item.optionC && item.optionD && Number.isInteger(item.answer) && item.answer >= 0 && item.answer <= 3;
  });
}

// 使用 Fisher-Yates 演算法洗牌。
function shuffleArray(sourceArray) {
  // 複製來源陣列，避免改動完整題庫。
  const shuffled = sourceArray.slice();
  // 從陣列尾端往前交換元素。
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    // 取得目前範圍內的隨機位置。
    const randomIndex = Math.floor(Math.random() * (index + 1));
    // 暫存目前元素。
    const temporary = shuffled[index];
    // 將隨機元素放到目前位置。
    shuffled[index] = shuffled[randomIndex];
    // 將暫存元素放到隨機位置。
    shuffled[randomIndex] = temporary;
  }
  // 回傳洗牌後陣列。
  return shuffled;
}

// 從完整題庫抽出五題並重設測驗狀態。
function startNewQuiz() {
  // 洗牌後取出五題。
  quizQuestions = shuffleArray(questionBank).slice(0, QUIZ_LENGTH);
  // 題庫資料異常時改用備援題庫補足。
  if (quizQuestions.length < QUIZ_LENGTH) {
    // 從備援題庫抽出五題。
    quizQuestions = shuffleArray(fallbackQuestions).slice(0, QUIZ_LENGTH);
  }
  // 回到第一題。
  currentQuestionIndex = 0;
  // 清除目前分數。
  score = 0;
  // 清除作答選項。
  selectedOption = -1;
  // 清除正確選項提示。
  correctOption = -1;
  // 清除煙火粒子。
  fireworks = [];
  // 切換至作答狀態。
  screenState = "quiz";
}

// 顯示題庫載入中的非空白畫面。
function drawLoadingScreen() {
  // 設定載入文字大小。
  textSize(constrain(Math.min(width, height) * 0.055, 22, 36));
  // 設定載入文字顏色。
  fill("#222222");
  // 顯示載入文字。
  text("題庫載入中，請稍候", width / 2, height / 2);
}

// 依照視窗尺寸計算標題、題目、選項與按鈕版面。
function updateLayout() {
  // 計算安全邊距。
  const safeMargin = Math.max(12, Math.min(width, height) * 0.035);
  // 計算主要內容寬度。
  const cardWidth = Math.max(1, Math.min(width - safeMargin * 2, 1050));
  // 計算主要內容左側位置。
  const cardX = (width - cardWidth) / 2;
  // 判斷是否為手機橫向的壓縮高度。
  const compactHeight = height < 480;
  // 計算內容頂端位置。
  const top = Math.max(compactHeight ? 8 : safeMargin, height * (compactHeight ? 0.025 : 0.055));
  // 設定測驗標題。
  const headerTitle = "國小閱讀理解小測驗";
  // 取得題數顯示文字。
  const totalQuestions = Math.max(QUIZ_LENGTH, quizQuestions.length);
  // 取得目前題號。
  const currentNumber = Math.max(1, currentQuestionIndex + 1);
  // 建立題數顯示文字。
  const headerProgressText = "第 " + currentNumber + " 題／共 " + totalQuestions + " 題";
  // 極窄手機使用上下分區。
  const headerStacked = cardWidth < 300;
  // 計算題數文字初始大小。
  let headerProgressSize = constrain(Math.min(width * 0.022, height * 0.035), 11, 22);
  // 設定測量題數時的字型大小。
  textSize(headerProgressSize);
  // 建立題數文字行。
  const headerProgressLines = headerStacked ? ["第 " + currentNumber + " 題／", "共 " + totalQuestions + " 題"] : [headerProgressText];
  // 計算題數文字寬度。
  let headerProgressTextWidth = Math.max.apply(null, headerProgressLines.map(function(line) { return textWidth(line); }));
  // 一般模式逐步縮小題數文字，保留標題安全區。
  while (!headerStacked && headerProgressTextWidth > cardWidth * 0.46 && headerProgressSize > 11) {
    // 縮小題數文字。
    headerProgressSize -= 1;
    // 套用縮小後字級。
    textSize(headerProgressSize);
    // 重新測量題數。
    headerProgressTextWidth = textWidth(headerProgressText);
  }
  // 極窄模式逐步縮小兩行題數文字。
  while (headerStacked && headerProgressTextWidth > cardWidth * 0.78 && headerProgressSize > 9) {
    // 縮小題數文字。
    headerProgressSize -= 1;
    // 套用縮小後字級。
    textSize(headerProgressSize);
    // 重新測量兩行題數。
    headerProgressTextWidth = Math.max.apply(null, headerProgressLines.map(function(line) { return textWidth(line); }));
  }
  // 計算題數獨立區域寬度。
  const headerProgressWidth = headerStacked ? cardWidth : Math.min(cardWidth * 0.5, Math.max(112, headerProgressTextWidth + 18));
  // 設定標題與題數之間的安全間隔。
  const headerGap = Math.max(12, cardWidth * 0.025);
  // 計算標題可使用的獨立寬度。
  const headerTitleMaxWidth = headerStacked ? Math.max(1, cardWidth * 0.92) : Math.max(1, cardWidth - headerProgressWidth - headerGap);
  // 計算標題文字大小。
  let headerTitleSize = constrain(width * 0.035, 14, 36);
  // 設定標題測量字級。
  textSize(headerTitleSize);
  // 標題太寬時逐步縮小。
  while (textWidth(headerTitle) > headerTitleMaxWidth && headerTitleSize > 12) {
    // 縮小標題文字。
    headerTitleSize -= 1;
    // 套用縮小後字級。
    textSize(headerTitleSize);
  }
  // 極窄手機允許標題分成兩行。
  const headerTitleMaxLines = headerStacked ? 2 : 1;
  // 計算標題行高。
  const headerTitleLineHeight = headerTitleSize * 1.18;
  // 計算標題區高度。
  const headerHeight = headerStacked ? constrain(height * (compactHeight ? 0.22 : 0.17), 86, 116) : (compactHeight ? constrain(height * 0.11, 42, 58) : constrain(height * 0.08, 52, 78));
  // 設定標題位置。
  const headerX = cardX + (headerStacked ? cardWidth * 0.04 : 0);
  // 設定標題垂直位置。
  const headerY = top + (headerStacked ? 4 : Math.max(0, (headerHeight - headerTitleLineHeight) / 2));
  // 設定題數區左側位置。
  const headerProgressX = headerStacked ? cardX : cardX + cardWidth - headerProgressWidth;
  // 設定題數區垂直位置。
  const headerProgressY = headerStacked ? top + headerHeight - headerProgressSize * 2.25 : top + headerHeight / 2;
  // 計算題目卡片高度。
  const questionHeight = compactHeight ? constrain(height * 0.35, 96, 125) : constrain(height * (width < 600 ? 0.25 : 0.23), 145, 245);
  // 計算選項間距。
  const gap = compactHeight ? 7 : constrain(cardWidth * 0.018, 10, 20);
  // 判斷選項是否使用雙欄。
  const twoColumns = width >= 680 || (height < 560 && width >= 300);
  // 計算選項寬度。
  const optionWidth = twoColumns ? (cardWidth - gap) / 2 : cardWidth;
  // 計算選項高度。
  const optionHeight = compactHeight ? 44 : (twoColumns ? constrain(height * 0.115, 62, 92) : constrain(height * 0.085, 58, 82));
  // 建立選項位置陣列。
  const options = [];
  // 逐一建立四個選項的位置。
  for (let index = 0; index < 4; index += 1) {
    // 計算選項欄位。
    const column = twoColumns ? index % 2 : 0;
    // 計算選項列數。
    const row = twoColumns ? Math.floor(index / 2) : index;
    // 計算選項水平位置。
    const x = cardX + column * (optionWidth + gap);
    // 計算選項垂直位置。
    const y = top + headerHeight + questionHeight + gap + row * (optionHeight + gap);
    // 保存選項矩形。
    options.push({ x: x, y: y, w: optionWidth, h: optionHeight });
  }
  // 計算按鈕寬度。
  const buttonWidth = Math.min(cardWidth, 260);
  // 計算按鈕高度。
  const buttonHeight = compactHeight ? 44 : constrain(height * 0.075, 54, 72);
  // 取得選項底部位置。
  const optionsBottom = options.length > 0 ? options[options.length - 1].y + options[options.length - 1].h : top;
  // 計算按鈕位置。
  const buttonY = Math.min(optionsBottom + gap * 1.25, height - buttonHeight - safeMargin);
  // 保存完整響應式版面資料。
  layout = { margin: safeMargin, cardWidth: cardWidth, top: top, headerHeight: headerHeight, headerX: headerX, headerY: headerY, headerTitleMaxWidth: headerTitleMaxWidth, headerTitleSize: headerTitleSize, headerTitleLineHeight: headerTitleLineHeight, headerTitleMaxLines: headerTitleMaxLines, headerProgressX: headerProgressX, headerProgressY: headerProgressY, headerProgressWidth: headerProgressWidth, headerProgressSize: headerProgressSize, headerProgressLines: headerProgressLines, headerStacked: headerStacked, questionHeight: questionHeight, gap: gap, optionWidth: optionWidth, optionHeight: optionHeight, options: options, button: { x: (width - buttonWidth) / 2, y: buttonY, w: buttonWidth, h: buttonHeight } };
}

// 繪製作答畫面。
function drawQuizScreen() {
  // 取得目前題目。
  const question = quizQuestions[currentQuestionIndex];
  // 沒有題目時顯示安全訊息。
  if (!question) {
    // 繪製安全訊息。
    drawSafeMessage("目前沒有可顯示的題目");
    // 結束目前畫面繪製。
    return;
  }
  // 繪製標題與題數。
  drawHeader(currentQuestionIndex + 1);
  // 繪製題目卡片。
  drawQuestionCard(question);
  // 繪製四個選項。
  drawOptions(question);
  // 作答後顯示下一題按鈕。
  if (selectedOption !== -1) {
    // 繪製下一題按鈕。
    drawActionButton("下一題");
  }
  // 題庫使用備援資料時顯示錯誤提示。
  if (dataErrorMessage) {
    // 繪製非阻塞錯誤提示。
    drawErrorNotice(dataErrorMessage);
  }
}

// 繪製不重疊的標題與題數資訊。
function drawHeader(questionNumber) {
  // 建立目前題號文字。
  const progressText = "第 " + questionNumber + " 題／共 " + quizQuestions.length + " 題";
  // 依版面模式建立一行或兩行題數。
  const progressLines = layout.headerStacked ? ["第 " + questionNumber + " 題／", "共 " + quizQuestions.length + " 題"] : [progressText];
  // 設定標題字級。
  textSize(layout.headerTitleSize);
  // 設定標題顏色。
  fill("#222222");
  // 將標題限制在左側專用區域。
  drawWrappedText("國小閱讀理解小測驗", layout.headerX, layout.headerY, layout.headerTitleMaxWidth, layout.headerTitleLineHeight, LEFT, TOP, layout.headerTitleMaxLines);
  // 設定題數字級。
  textSize(layout.headerProgressSize);
  // 設定題數文字顏色。
  fill("#222222");
  // 設定題數靠右對齊。
  textAlign(RIGHT, CENTER);
  // 逐行繪製題數文字。
  for (let lineIndex = 0; lineIndex < progressLines.length; lineIndex += 1) {
    // 計算每一行題數的垂直位置。
    const lineY = layout.headerStacked ? layout.headerProgressY + lineIndex * layout.headerProgressSize * 1.15 : layout.headerProgressY;
    // 繪製在題數專用區域的右邊界。
    text(progressLines[lineIndex], layout.headerProgressX + layout.headerProgressWidth, lineY);
  }
  // 還原文字對齊方式。
  textAlign(CENTER, CENTER);
}

// 繪製文章與問題卡片。
function drawQuestionCard(question) {
  // 計算卡片位置。
  const x = (width - layout.cardWidth) / 2;
  // 計算卡片頂端。
  const y = layout.top + layout.headerHeight;
  // 設定題目卡片顏色。
  fill(QUESTION_BACKGROUND);
  // 移除卡片外框。
  noStroke();
  // 繪製圓角題目卡片。
  rect(x, y, layout.cardWidth, layout.questionHeight, 18);
  // 設定卡片文字顏色。
  fill("#222222");
  // 計算文章文字大小。
  const passageSize = constrain(Math.min(width * 0.022, height * 0.032), 15, 23);
  // 設定文章文字大小。
  textSize(passageSize);
  // 計算卡片文字左側內距。
  const innerX = x + layout.cardWidth * 0.045;
  // 計算卡片文字可用寬度。
  const innerWidth = layout.cardWidth * 0.91;
  // 繪製文章內容。
  drawWrappedText(question.passage, innerX, y + layout.questionHeight * 0.08, innerWidth, passageSize * 1.35, LEFT, TOP, 3);
  // 設定問題文字大小。
  textSize(constrain(passageSize * 1.05, 16, 25));
  // 繪製問題內容。
  drawWrappedText("問題：" + question.question, innerX, y + layout.questionHeight * 0.68, innerWidth, passageSize * 1.4, LEFT, TOP, 2);
}

// 繪製四個選項與答題動畫。
function drawOptions(question) {
  // 依照固定欄位順序建立選項文字。
  const optionTexts = [question.optionA, question.optionB, question.optionC, question.optionD];
  // 逐一繪製四個選項。
  for (let index = 0; index < layout.options.length; index += 1) {
    // 取得目前選項位置。
    const option = layout.options[index];
    // 設定水平動畫位移。
    let offsetX = 0;
    // 設定垂直動畫位移。
    let offsetY = 0;
    // 正確答案上下跳動。
    if (selectedOption !== -1 && index === correctOption) {
      // 使用正弦函數產生上下移動。
      offsetY = Math.sin(frameCount * 0.18) * Math.min(10, option.h * 0.12);
    }
    // 答錯選項左右移動。
    if (selectedOption !== -1 && index === selectedOption && selectedOption !== correctOption) {
      // 使用正弦函數產生左右移動。
      offsetX = Math.sin(frameCount * 0.42) * Math.min(10, option.w * 0.025);
    }
    // 判斷目前選項應使用的背景色。
    if (selectedOption !== -1 && index === selectedOption && selectedOption !== correctOption) {
      // 設定答錯紅色。
      fill(WRONG_BACKGROUND);
    } else if (selectedOption !== -1 && index === correctOption) {
      // 設定答對黃色。
      fill(CORRECT_BACKGROUND);
    } else {
      // 設定未作答白色。
      fill(OPTION_BACKGROUND);
    }
    // 移除選項外框。
    noStroke();
    // 繪製選項背景。
    rect(option.x + offsetX, option.y + offsetY, option.w, option.h, 14);
    // 答錯選項使用白色文字，其他狀態使用深色文字。
    fill(selectedOption !== -1 && index === selectedOption && selectedOption !== correctOption ? "#ffffff" : "#222222");
    // 設定選項文字大小。
    textSize(constrain(Math.min(width * 0.023, height * 0.034), 16, 24));
    // 組合選項代號與文字。
    const label = String.fromCharCode(65 + index) + ". " + optionTexts[index];
    // 繪製置中且自動換行的選項文字。
    drawWrappedText(label, option.x + offsetX + option.w * 0.05, option.y + offsetY + option.h * 0.12, option.w * 0.9, textSize() * 1.35, CENTER, TOP, 3);
  }
}

// 繪製下一題或重新測驗按鈕。
function drawActionButton(label) {
  // 取得按鈕版面。
  const button = layout.button;
  // 設定按鈕背景色。
  fill("#6d597a");
  // 移除按鈕外框。
  noStroke();
  // 繪製圓角按鈕。
  rect(button.x, button.y, button.w, button.h, 16);
  // 設定按鈕文字顏色。
  fill("#ffffff");
  // 設定按鈕文字大小。
  textSize(constrain(width * 0.024, 17, 25));
  // 顯示按鈕文字。
  text(label, button.x + button.w / 2, button.y + button.h / 2);
}

// 繪製題庫錯誤提示。
function drawErrorNotice(message) {
  // 設定錯誤提示字級。
  textSize(constrain(width * 0.014, 12, 16));
  // 設定錯誤提示顏色。
  fill("#7a1830");
  // 在畫面底部繪製提示。
  drawWrappedText(message, layout.margin, height - layout.margin * 0.8, width - layout.margin * 2, textSize() * 1.2, CENTER, BOTTOM, 3);
}

// 繪製安全訊息。
function drawSafeMessage(message) {
  // 設定安全訊息字級。
  textSize(24);
  // 設定安全訊息顏色。
  fill("#222222");
  // 繪製安全訊息。
  text(message, width / 2, height / 2);
}

// 將中文與一般文字依照寬度分行。
function drawWrappedText(content, x, y, maxWidth, lineHeight, horizontalAlign, verticalAlign, maxLines) {
  // 建立文字行陣列。
  const lines = [];
  // 儲存目前文字行。
  let currentLine = "";
  // 將內容轉成字串後逐字處理。
  const textContent = String(content || "");
  // 逐字計算換行。
  for (let index = 0; index < textContent.length; index += 1) {
    // 取得目前字元。
    const character = textContent[index];
    // 組合測量中的候選文字。
    const candidate = currentLine + character;
    // 寬度超過上限且目前行有內容時換行。
    if (textWidth(candidate) > maxWidth && currentLine.length > 0) {
      // 保存目前文字行。
      lines.push(currentLine);
      // 從目前字元開始新的文字行。
      currentLine = character;
    } else {
      // 將目前字元加入文字行。
      currentLine = candidate;
    }
  }
  // 保存最後一行文字。
  if (currentLine.length > 0) {
    // 將最後一行加入陣列。
    lines.push(currentLine);
  }
  // 沒有文字時不進行繪製。
  if (lines.length === 0) {
    // 結束文字繪製。
    return;
  }
  // 超過最大行數時保留可視範圍內的完整行。
  if (maxLines && lines.length > maxLines) {
    // 截取指定行數，避免文字超出元件。
    lines.length = maxLines;
  }
  // 設定文字對齊方式。
  textAlign(horizontalAlign, verticalAlign);
  // 逐行繪製文字。
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    // 繪製目前文字行。
    text(lines[lineIndex], x, y + lineIndex * lineHeight, maxWidth, lineHeight);
  }
  // 還原文字對齊方式。
  textAlign(CENTER, CENTER);
}

// 處理滑鼠按下。
function mousePressed() {
  // 忽略觸控後由瀏覽器產生的合成滑鼠事件。
  if (millis() - lastTouchTime < 500) {
    // 阻止重複作答。
    return false;
  }
  // 將滑鼠座標交給共用處理函式。
  handlePointerPress(mouseX, mouseY);
  // 阻止瀏覽器預設行為。
  return false;
}

// 處理觸控按下。
function touchStarted() {
  // 記錄觸控時間。
  lastTouchTime = millis();
  // 取得第一個觸控點。
  const touchPoint = touches.length > 0 ? touches[0] : { x: mouseX, y: mouseY };
  // 將觸控座標交給共用處理函式。
  handlePointerPress(touchPoint.x, touchPoint.y);
  // 阻止頁面滑動。
  return false;
}

// 根據點擊位置處理選項與按鈕。
function handlePointerPress(pointerX, pointerY) {
  // 載入期間不接受操作。
  if (dataIsLoading || screenState === "loading") {
    // 結束點擊處理。
    return;
  }
  // 完成畫面只處理重新測驗按鈕。
  if (screenState === "finished") {
    // 判斷是否點擊重新測驗。
    if (isPointInside(pointerX, pointerY, layout.button)) {
      // 重新向 Google Sheets 讀取最新題庫。
      loadQuestionBank();
    }
    // 結束完成畫面處理。
    return;
  }
  // 已作答時只處理下一題按鈕。
  if (selectedOption !== -1) {
    // 判斷是否點擊下一題。
    if (isPointInside(pointerX, pointerY, layout.button)) {
      // 前往下一題或完成畫面。
      goToNextQuestion();
    }
    // 結束已作答處理。
    return;
  }
  // 逐一檢查四個選項。
  for (let index = 0; index < layout.options.length; index += 1) {
    // 判斷是否點擊目前選項。
    if (isPointInside(pointerX, pointerY, layout.options[index])) {
      // 記錄答案。
      answerQuestion(index);
      // 結束選項檢查。
      return;
    }
  }
}

// 判斷座標是否位於矩形範圍內。
function isPointInside(pointX, pointY, rectangle) {
  // 回傳四個邊界條件的結果。
  return pointX >= rectangle.x && pointX <= rectangle.x + rectangle.w && pointY >= rectangle.y && pointY <= rectangle.y + rectangle.h;
}

// 記錄答案並計算分數。
function answerQuestion(optionIndex) {
  // 防止同一題重複作答。
  if (selectedOption !== -1) {
    // 結束重複作答。
    return;
  }
  // 保存使用者選項。
  selectedOption = optionIndex;
  // 保存題目正確選項。
  correctOption = Number(quizQuestions[currentQuestionIndex].answer);
  // 答對時增加一分。
  if (selectedOption === correctOption) {
    // 累加答對題數。
    score += 1;
  }
}

// 前往下一題或切換完成畫面。
function goToNextQuestion() {
  // 尚有下一題時前往下一題。
  if (currentQuestionIndex < quizQuestions.length - 1) {
    // 增加目前題目索引。
    currentQuestionIndex += 1;
    // 清除選項狀態。
    selectedOption = -1;
    // 清除正確答案提示。
    correctOption = -1;
    // 結束前往下一題。
    return;
  }
  // 切換到完成畫面。
  screenState = "finished";
  // 記錄請加油動畫起始時間。
  encouragementStartedAt = millis();
  // 答對三題以上時啟動煙火。
  if (score > 2) {
    // 啟動煙火特效。
    startFireworks();
  } else {
    // 清除煙火特效。
    fireworks = [];
  }
}

// 繪製完成與總成績畫面。
function drawFinishedScreen() {
  // 設定完成標題大小。
  textSize(constrain(width * 0.055, 29, 58));
  // 設定完成標題顏色。
  fill("#222222");
  // 顯示完成標題。
  text("測驗完成！", width / 2, height * 0.17);
  // 設定成績字級。
  textSize(constrain(width * 0.07, 36, 78));
  // 顯示答對題數。
  text("答對 " + score + "／" + quizQuestions.length + " 題", width / 2, height * 0.31);
  // 設定鼓勵文字字級。
  textSize(constrain(width * 0.032, 20, 34));
  // 設定鼓勵文字顏色。
  fill("#6d597a");
  // 顯示成績鼓勵文字。
  text(score > 2 ? "表現得很棒！" : "再努力一下，你會更進步！", width / 2, height * 0.43);
  // 答對三題以上顯示煙火。
  if (score > 2) {
    // 繪製煙火特效。
    drawFireworks();
  } else {
    // 繪製請加油特效。
    drawEncouragementAnimation();
  }
  // 將重新測驗按鈕放在畫面下方。
  layout.button.y = Math.min(height * 0.78, height - layout.button.h - layout.margin);
  // 繪製重新測驗按鈕。
  drawActionButton("重新測驗");
}

// 建立煙火粒子。
function startFireworks() {
  // 保存煙火開始時間。
  fireworksStartedAt = millis();
  // 清除舊有粒子。
  fireworks = [];
  // 設定三組煙火中心。
  const centers = [{ x: width * 0.27, y: height * 0.58 }, { x: width * 0.5, y: height * 0.5 }, { x: width * 0.73, y: height * 0.61 }];
  // 逐組建立粒子。
  centers.forEach(function(center, centerIndex) {
    // 每組建立三十六個方向。
    for (let index = 0; index < 36; index += 1) {
      // 計算粒子角度。
      const angle = Math.PI * 2 * index / 36;
      // 計算粒子速度。
      const speed = 1.3 + (index % 5) * 0.22 + centerIndex * 0.08;
      // 保存粒子資料。
      fireworks.push({ x: center.x, y: center.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, hue: (centerIndex * 80 + index * 7) % 360 });
    }
  });
}

// 更新並繪製煙火。
function drawFireworks() {
  // 使用 HSB 色彩模式產生鮮豔顏色。
  colorMode(HSB, 360, 100, 100, 1);
  // 更新所有煙火粒子。
  fireworks.forEach(function(particle) {
    // 加入輕微重力。
    particle.vy += 0.018;
    // 更新粒子水平位置。
    particle.x += particle.vx;
    // 更新粒子垂直位置。
    particle.y += particle.vy;
    // 降低粒子生命值。
    particle.life -= 0.008;
    // 設定粒子顏色。
    stroke(particle.hue, 82, 100, Math.max(0, particle.life));
    // 設定粒子粗細。
    strokeWeight(3);
    // 繪製粒子。
    point(particle.x, particle.y);
  });
  // 移除生命結束的粒子。
  fireworks = fireworks.filter(function(particle) { return particle.life > 0; });
  // 煙火結束後重新建立一輪。
  if (fireworks.length === 0 || millis() - fireworksStartedAt > 2800) {
    // 重新啟動煙火。
    startFireworks();
  }
  // 還原 RGB 色彩模式。
  colorMode(RGB, 255, 255, 255, 1);
}

// 繪製答對不到三題時的請加油動畫。
function drawEncouragementAnimation() {
  // 計算目前動畫循環時間。
  const elapsed = (millis() - encouragementStartedAt) % 1800;
  // 計算由小變大再回到原大小的比例。
  const scaleValue = 1 + 0.35 * Math.sin(elapsed / 1800 * Math.PI);
  // 設定動畫文字大小。
  textSize(constrain(width * 0.065, 34, 72) * scaleValue);
  // 設定動畫文字顏色。
  fill(WRONG_BACKGROUND);
  // 顯示請加油文字。
  text("請加油", width / 2, height * 0.59);
}

// 視窗尺寸改變時重新調整畫布。
function windowResized() {
  // 將畫布調整為最新視窗尺寸。
  resizeCanvas(windowWidth, windowHeight);
  // 重新計算版面。
  updateLayout();
}
