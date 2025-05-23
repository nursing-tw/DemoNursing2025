// 全域變數
let currentScreen = 1;
let countdownInterval;
let totalSeconds = 0;
let remainingSeconds = 0;
let startTimeValue;
let endTimeValue;
let selectedEduContent = null;
let currentQuizAnswers = {};
let achievedStars = 0;
let completedEduContents = [];
let autoSaveInterval;

// localStorage 鍵名
const STORAGE_KEY = 'countdownWheelQuestionnaire';

// 全域函式：填充單位下拉選單
function populateUnitOptions(units) {
    const unitSelect = document.getElementById('unit');
    unitSelect.innerHTML = '<option value="" selected disabled>請選擇單位</option>';
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        unitSelect.appendChild(option);
    });
}

// 全域函式：更新衛教內容下拉選單
function updateEduContentOptions(selectedUnit) {
    const eduContentSelect = document.getElementById('eduContent');
    eduContentSelect.innerHTML = '<option value="" selected disabled>請選擇衛教內容</option>';
    if (window.eduMapping && window.eduMapping[selectedUnit]) {
        window.eduMapping[selectedUnit].forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.title;
            eduContentSelect.appendChild(option);
        });
    }
}

// DOM 載入完成後執行
document.addEventListener('DOMContentLoaded', function () {

    // 一開始隱藏 .position-sticky 區塊
    const stickyHeader = document.querySelector('.position-sticky');
    stickyHeader.classList.add('d-none');

    // 定義函式顯示stickyHeader
    function showStickyHeader() {
        stickyHeader.classList.remove('d-none');
    }

    // 定義函式隱藏stickyHeader
    function hideStickyHeader() {
        stickyHeader.classList.add('d-none');
    }

    // 建立全域的 eduMapping
    window.eduMapping = {};
    eduData.forEach(item => {
        if (!window.eduMapping[item.unitName]) {
            window.eduMapping[item.unitName] = [];
        }
        window.eduMapping[item.unitName].push(item);
    });

    // 填充單位下拉選單
    populateUnitOptions(Object.keys(window.eduMapping));

    // 當單位改變時更新衛教內容
    document.getElementById('unit').addEventListener('change', function () {
        const selectedUnit = this.value;
        updateEduContentOptions(selectedUnit);
    });

    // 動態載入單位名稱到下拉選單
    function populateUnitOptions(units) {
        const unitSelect = document.getElementById('unit');
        unitSelect.innerHTML = '<option value="" selected disabled>請選擇單位</option>';
        units.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit;
            option.textContent = unit;
            unitSelect.appendChild(option);
        });
    }

    // 更新衛教內容選項
    function updateEduContentOptions(selectedUnit) {
        const eduContentSelect = document.getElementById('eduContent');
        eduContentSelect.innerHTML = '<option value="" selected disabled>請選擇衛教內容</option>';
        if (eduMapping[selectedUnit]) {
            eduMapping[selectedUnit].forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.title;
                eduContentSelect.appendChild(option);
            });
        }
    }

    const startTimeInput = document.getElementById('startTimeInput');

    // 預帶當前時間（24小時制）
    function setCurrentTime() {
        let now = new Date();
        let currentHour = now.getHours().toString().padStart(2, '0');
        let currentMinute = now.getMinutes().toString().padStart(2, '0');
        startTimeInput.value = `${currentHour}:${currentMinute}`;
    }

    setCurrentTime(); // 初始化預帶目前時間

    // 建立時間選項
    populateTimeOptions(timeSetData);

    // 初始化轉盤
    initWheel();

    // 從 localStorage 載入數據
    loadFromLocalStorage();

    // 設置自動保存
    setupAutoSave();

    // 表單提交事件
    document.getElementById('setupForm').addEventListener('submit', function (e) {
        e.preventDefault();
        setupCountdown();
        showStickyHeader(); // 倒數開始後立即顯示上方區塊
    });

    // 轉盤按鈕點擊事件
    document.getElementById('spinButton').addEventListener('click', spinWheel);

    // 完成閱讀按鈕點擊事件
    document.getElementById('finishReading').addEventListener('click', function () {
        showScreen(4);
        saveToLocalStorage(); // 保存狀態
    });

    // 提交測驗按鈕點擊事件
    document.getElementById('submitQuiz').addEventListener('click', evaluateQuiz);

    // 再試試看按鈕點擊事件
    document.getElementById('retryQuiz').addEventListener('click', function () {
        showScreen(4);
        saveToLocalStorage(); // 保存狀態
    });

    // 重置按鈕點擊事件
    document.getElementById('resetButton').addEventListener('click', function () {
        if (confirm('確定要重置所有數據嗎？這將清除您的所有進度和成就。')) {
            clearLocalStorage();
            // 返回第一畫面
            showScreen(1);
            hideStickyHeader(); // 重置後再度隱藏上方區塊
        }
    });

    const fontDecreaseButton = document.getElementById('fontDecreaseButton');
    const fontIncreaseButton = document.getElementById('fontIncreaseButton');
    const container = document.querySelector('body');
    const fontSizes = ['font-size-xs', 'font-size-sm', 'font-size-md', 'font-size-lg', 'font-size-xl', 'font-size-xxl'];

    // 預設字體大小
    let currentFontSizeIndex = fontSizes.indexOf('font-size-md');

    // 縮小字體
    fontDecreaseButton.addEventListener('click', () => {
        if (currentFontSizeIndex > 0) {
            container.classList.remove(fontSizes[currentFontSizeIndex]);
            currentFontSizeIndex--;
            container.classList.add(fontSizes[currentFontSizeIndex]);
        }
    });

    // 放大字體
    fontIncreaseButton.addEventListener('click', () => {
        if (currentFontSizeIndex < fontSizes.length - 1) {
            container.classList.remove(fontSizes[currentFontSizeIndex]);
            currentFontSizeIndex++;
            container.classList.add(fontSizes[currentFontSizeIndex]);
        }
    });

    // 朗讀功能
    const readAloudButton = document.getElementById('readAloudButton');
    let synth = window.speechSynthesis;

    readAloudButton.addEventListener('click', () => {
        if (synth.speaking) {
            synth.cancel(); // 如果正在朗讀，再次點擊則停止
            readAloudButton.classList.remove('active');
            return;
        }

        let textToRead = getTextContentForReading();
        if (textToRead) {
            let utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = 'zh-TW'; // 設定為繁體中文發音，可依需求調整

            // 朗讀開始
            utterance.onstart = function () {
                readAloudButton.classList.add('active');
            };

            // 朗讀結束
            utterance.onend = function () {
                readAloudButton.classList.remove('active');
            };

            synth.speak(utterance);
        } else {
            alert('目前沒有可朗讀的內容。');
        }

    });

    // 自訂函式：取得要朗讀的內容
    function getTextContentForReading() {
        // 根據目前所在畫面，取得相應內容
        switch (currentScreen) {
            case 1: // 首頁
                return document.querySelector('#screen1').innerText;
            case 2: // 倒數狀態和轉盤
                return document.querySelector('#screen2').innerText;
            case 3: // 衛教內容
                return document.querySelector('#eduContentText').innerText;
            case 4: // 問答頁面
                return document.querySelector('#screen4').innerText;
            case 5: // 結果頁面
                return document.querySelector('#screen5').innerText;
            default:
                return '';
        }
    }

    document.getElementById('restartButton').addEventListener('click', () => {
        showScreen(1);          // 回到第一畫面
        clearLocalStorage();    // 清除舊的數據
    });


});
//時間設定項目
function populateTimeOptions(data) {
    const container = document.getElementById('timeOptionContainer');

    // 如果容器中已有其他子元素 (例如 label) 我們就把選項部分放在另一個 div
    let radiosContainer = container.querySelector('.time-options');
    if (!radiosContainer) {
        radiosContainer = document.createElement('div');
        radiosContainer.className = 'time-options';
        container.appendChild(radiosContainer);
    } else {
        radiosContainer.innerHTML = '';
    }

    data.forEach((item, index) => {
        const radioDiv = document.createElement('label');
        radioDiv.className = 'form-check';

        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'radio';
        input.name = 'countdownOption';
        input.id = `countdownOption-${index}`;

        // 將字串解析成秒：
        let seconds = 0;
        if (item.val.toUpperCase().endsWith('H')) {
            seconds = parseInt(item.val) * 3600;
        } else if (item.val.toLowerCase().endsWith('m')) {
            seconds = parseInt(item.val) * 60;
        }
        input.value = seconds; // 值就是秒數
        if (index === 0) {
            input.checked = true;
        }

        const label = document.createElement('span');
        label.className = 'form-check-label';
        label.htmlFor = input.id;
        // 你可以在這裡顯示更友善的文字，例如 "4 小時"，你也可以改寫資料內容
        label.textContent = item.val;

        radioDiv.appendChild(input);
        radioDiv.appendChild(label);
        radiosContainer.appendChild(radioDiv);
    });
}
// 設置自動保存
function setupAutoSave() {
    // 清除之前的自動保存計時器
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }

    // 每 30 秒自動保存一次
    autoSaveInterval = setInterval(function () {
        saveToLocalStorage();
    }, 30000);
}

// 保存數據到 localStorage
function saveToLocalStorage() {

    const dataToSave = {
        achievedStars: achievedStars,
        completedEduContents: completedEduContents,
        currentScreen: currentScreen,
        countdown: {
            active: !!countdownInterval,
            totalSeconds: totalSeconds,
            remainingSeconds: remainingSeconds,
            startTime: startTimeValue ? startTimeValue.toISOString() : null,
            endTime: endTimeValue ? endTimeValue.toISOString() : null
        },
        formSettings: {
            startTimeInput: document.getElementById('startTimeInput').value,
            countdownOption: document.querySelector('input[name="countdownOption"]:checked').value,
            selectedUnit: document.getElementById('unit').value,
            selectedEduContent: document.getElementById('eduContent').value
        },
        // 儲存目前顯示的教育內容物件
        selectedEduContent: selectedEduContent ? selectedEduContent : null,
        // 新增：保存目前選取的教育內容 id
        selectedEduContentId: selectedEduContent ? selectedEduContent.id : null,
        lastSaved: new Date().toISOString()
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

        console.log('數據已保存到 localStorage');
    } catch (error) {
        console.error('保存數據到 localStorage 時出錯:', error);
    }
}

// 從 localStorage 載入數據
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const stickyHeader = document.querySelector('.position-sticky'); // 新增此行

        if (savedData) {
            const data = JSON.parse(savedData);

            // 還原成就與完成的項目
            achievedStars = data.achievedStars || 0;
            completedEduContents = data.completedEduContents || [];
            updateAchievementArea();

            // 如果有儲存倒數資訊且儲存中有開始時間
            if (data.countdown && data.countdown.active && data.countdown.startTime) {
                totalSeconds = data.countdown.totalSeconds; // 例如 6*3600 或 4*3600
                // 以存下的 startTime 重新計算預期結束時間
                startTimeValue = new Date(data.countdown.startTime);
                const intendedEndTime = new Date(startTimeValue.getTime() + totalSeconds * 1000);
                endTimeValue = intendedEndTime;

                // 重新計算剩餘秒數（根據目前時間與預期結束時間）
                const now = new Date();
                const diffSeconds = Math.floor((intendedEndTime - now) / 1000);
                if (diffSeconds > 0) {
                    remainingSeconds = diffSeconds;
                    // 更新畫面上的開始與結束時間
                    document.getElementById('startTime').textContent = formatTime(startTimeValue);
                    document.getElementById('endTime').textContent = formatTime(endTimeValue);

                    // 啟動倒數計時
                    startCountdown();

                    // 還原表單設定（如果之前是倒數畫面）
                    if (data.currentScreen === 2 && data.formSettings) {
                        document.getElementById('startTimeInput').value = data.formSettings.startTimeInput || '';
                        const unitSelect = document.getElementById('unit');
                        if (data.formSettings.selectedUnit) {
                            unitSelect.value = data.formSettings.selectedUnit;
                            updateEduContentOptions(data.formSettings.selectedUnit);
                        }
                        const eduSelect = document.getElementById('eduContent');
                        if (data.formSettings.selectedEduContent) {
                            eduSelect.value = data.formSettings.selectedEduContent;
                        }
                        showScreen(2);
                        stickyHeader.classList.remove('d-none');
                        return; // 還原到倒數畫面後結束
                    }
                } else {
                    // 倒數時間已過，直接顯示倒數結束畫面
                    remainingSeconds = 0;
                    showScreen(6);
                    stickyHeader.classList.remove('d-none');
                }
            }

            // 還原表單設定（適用於非倒數狀態，例如畫面1）
            if (data.formSettings) {
                document.getElementById('startTimeInput').value = data.formSettings.startTimeInput || '';
                const unitSelect = document.getElementById('unit');
                if (data.formSettings.selectedUnit) {
                    unitSelect.value = data.formSettings.selectedUnit;
                    updateEduContentOptions(data.formSettings.selectedUnit);
                }
                const eduSelect = document.getElementById('eduContent');
                if (data.formSettings.selectedEduContent) {
                    eduSelect.value = data.formSettings.selectedEduContent;
                }

            }

            // 如果當前畫面是第三畫面(衛教內容頁面)且有保存的教育內容物件
            if (data.currentScreen === 3 && data.selectedEduContent) {
                selectedEduContent = data.selectedEduContent;
                displayEducationalContent(selectedEduContent);
                stickyHeader.classList.remove('d-none');
            }

            // 還原作答畫面：如果當前畫面是作答畫面（例如 screen4），且存有 selectedEduContentId
            if (data.currentScreen === 4 && data.selectedEduContentId) {
                selectedEduContent = educationalContent.find(content => content.id === data.selectedEduContentId);
                if (selectedEduContent) {
                    // 顯示作答畫面，並重新產生測驗問題
                    displayEducationalContent(selectedEduContent);
                }
                stickyHeader.classList.remove('d-none');
            }

            // 還原當前畫面（如果有保存）
            if (data.currentScreen) {
                // 如果重整時的 currentScreen 為 5（結果頁），則返回第二畫面
                if (data.currentScreen === 5) {
                    showScreen(2);
                } else {
                    showScreen(data.currentScreen);
                }
                stickyHeader.classList.remove('d-none');
            } else {
                // 如果沒有任何資料，確保上方區塊隱藏
                stickyHeader.classList.add('d-none'); // 新增此行
            }
            console.log('數據已從 localStorage 載入');
        }

    } catch (error) {
        console.error('從 localStorage 載入數據時出錯:', error);
    }
}

// 初始化轉盤
function initWheel() {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製轉盤背景
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#f8f9fa';
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#F1604D';
    ctx.stroke();

    // 繪製轉盤分區
    const sliceAngle = 2 * Math.PI / wheelEmojis.length;
    for (let i = 0; i < wheelEmojis.length; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = (i + 1) * sliceAngle;

        // 繪製扇形
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? '#FF7878' : '#FFB949';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        // 繪製表情符號
        const angle = startAngle + sliceAngle / 2;
        const posX = centerX + radius * 0.7 * Math.cos(angle);
        const posY = centerY + radius * 0.7 * Math.sin(angle);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '40px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText(wheelEmojis[i], posX, posY);
    }

    // 繪製中心點
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
    ctx.fillStyle = '#E82424';
    ctx.fill();
}

// 轉動轉盤
function spinWheel() {
    const canvas = document.getElementById('wheelCanvas');
    const spinButton = document.getElementById('spinButton');

    // 禁用按鈕
    spinButton.disabled = true;

    // 添加旋轉動畫
    canvas.classList.add('spinning');

    // 3秒後停止旋轉並選擇隨機教育內容
    setTimeout(function () {
        canvas.classList.remove('spinning');
        spinButton.disabled = false;


        // 取得下拉選擇的衛教內容的 eduData id
        const eduContentSelect = document.getElementById('eduContent');
        const selectedEduDataId = parseInt(eduContentSelect.value);
        const selectedEduData = eduData.find(item => item.id === selectedEduDataId);

        if (!selectedEduData) {
            alert("請先選擇衛教內容");
            return;
        }

        // 根據所選的衛教內容篩選 educationalContent 中的項目
        let availableContent = educationalContent.filter(content =>
            selectedEduData.contentIds.includes(content.id) &&
            !completedEduContents.includes(content.id)
        );

        // 如果所有內容都已完成，則重新取出所有對應內容
        if (availableContent.length === 0) {
            availableContent = educationalContent.filter(content =>
                selectedEduData.contentIds.includes(content.id)
            );
        }

        // 隨機選擇
        const randomIndex = Math.floor(Math.random() * availableContent.length);
        selectedEduContent = availableContent[randomIndex];

        // 顯示教育內容
        displayEducationalContent(selectedEduContent);

        // 切換到第三畫面
        showScreen(3);

        // 保存狀態
        saveToLocalStorage();
    }, 3000);
}

// 顯示教育內容
function displayEducationalContent(content) {
    const titleElement = document.getElementById('eduTitle');
    const contentElement = document.getElementById('eduContentText');

    // 設置標題
    titleElement.textContent = content.title;

    // 清空內容區域
    contentElement.innerHTML = '';

    // 添加內容
    content.content.forEach(item => {
        if (item.type === 'paragraph') {
            const p = document.createElement('p');
            p.textContent = item.text;
            contentElement.appendChild(p);
        } else if (item.type === 'section') {
            const section = document.createElement('div');
            section.className = 'mb-3';

            const h4 = document.createElement('h4');
            h4.textContent = item.title;
            section.appendChild(h4);

            const p = document.createElement('p');
            p.innerHTML = item.text.replace(/\n/g, '<br>');
            section.appendChild(p);

            contentElement.appendChild(section);
        }
    });

    // 準備測驗問題
    prepareQuiz(content.questions);
}

// 準備測驗問題
function prepareQuiz(questions) {
    const quizContainer = document.getElementById('quizContainer');

    // 清空問題容器
    quizContainer.innerHTML = '';

    // 重置當前測驗答案
    currentQuizAnswers = {};

    // 添加問題
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'quiz-question';

        const questionTitle = document.createElement('strong');
        questionTitle.className = 'd-block';
        questionTitle.textContent = `${index + 1}. ${question.question}`;
        questionDiv.appendChild(questionTitle);

        if (question.type === 'truefalse') {
            // 是非題
            const trueOption = createRadioOption(question.id, 'true', '是');
            const falseOption = createRadioOption(question.id, 'false', '否');

            questionDiv.appendChild(trueOption);
            questionDiv.appendChild(falseOption);
        } else if (question.type === 'multiple') {
            // 選擇題
            question.options.forEach((option, optIndex) => {
                const optionElement = createRadioOption(question.id, optIndex.toString(), option);
                questionDiv.appendChild(optionElement);
            });
        }

        quizContainer.appendChild(questionDiv);
    });
}

// 創建單選按鈕選項
function createRadioOption(questionId, value, label) {
    const div = document.createElement('label');
    div.className = 'form-check';

    const input = document.createElement('input');
    input.className = 'form-check-input';
    input.type = 'radio';
    input.name = questionId;
    input.id = `${questionId}-${value}`;
    input.value = value;

    input.addEventListener('change', function () {
        currentQuizAnswers[questionId] = this.value;
    });

    const labelElement = document.createElement('span');
    labelElement.className = 'form-check-label';
    labelElement.htmlFor = `${questionId}-${value}`;
    labelElement.textContent = label;

    div.appendChild(input);
    div.appendChild(labelElement);

    return div;
}

// 評估測驗結果
function evaluateQuiz() {
    if (!selectedEduContent || !selectedEduContent.questions) {
        alert("教育內容尚未正確載入，請重新選擇或稍後再試！");
        return;
    }

    const wrongAnswers = [];
    let allCorrect = true;

    // 檢查每個問題的答案
    selectedEduContent.questions.forEach(question => {
        const userAnswer = currentQuizAnswers[question.id];
        // 如果用戶沒有回答，視為錯誤
        if (userAnswer === undefined) {
            wrongAnswers.push(question);
            allCorrect = false;
            return;
        }
        // 檢查答案
        if (question.type === 'truefalse') {
            if ((userAnswer === 'true' && !question.answer) ||
                (userAnswer === 'false' && question.answer)) {
                wrongAnswers.push(question);
                allCorrect = false;
            }
        } else if (question.type === 'multiple') {
            if (parseInt(userAnswer) !== question.answer) {
                wrongAnswers.push(question);
                allCorrect = false;
            }
        }
    });

    // 接下來是顯示結果與後續處理
    showQuizResult(allCorrect, wrongAnswers);
    saveToLocalStorage();
}

// 顯示測驗結果
function showQuizResult(allCorrect, wrongAnswers) {
    const wrongAnswersDiv = document.getElementById('wrongAnswers');
    const wrongAnswersList = document.getElementById('wrongAnswersList');
    const successResult = document.getElementById('successResult');

    // 清空錯誤答案列表
    wrongAnswersList.innerHTML = '';

    if (allCorrect) {
        // 全部答對
        wrongAnswersDiv.classList.add('d-none');
        successResult.classList.remove('d-none');

        // 如果這個教育內容還沒有完成過，添加到已完成列表
        if (!completedEduContents.includes(selectedEduContent.id)) {
            completedEduContents.push(selectedEduContent.id);
            achievedStars++;

            // 更新成果區
            updateAchievementArea();

            // 保存狀態
            saveToLocalStorage();
        }

        // 5秒後返回第二畫面
        setTimeout(function () {
            showScreen(2);
            saveToLocalStorage(); // 保存狀態
        }, 5000);
    } else {
        // 有錯誤答案
        wrongAnswersDiv.classList.remove('d-none');
        successResult.classList.add('d-none');

        // 顯示錯誤答案
        wrongAnswers.forEach(question => {
            const wrongAnswerDiv = document.createElement('div');
            wrongAnswerDiv.className = 'wrong-answer';

            const questionText = document.createElement('p');
            questionText.className = 'mb-2';
            questionText.textContent = question.question;
            wrongAnswerDiv.appendChild(questionText);

            const correctAnswerText = document.createElement('p');
            correctAnswerText.className = 'mb-0 text-bg-success d-inline-block px-2';

            if (question.type === 'truefalse') {
                correctAnswerText.textContent = `正確答案：${question.answer ? '是' : '否'}`;
            } else if (question.type === 'multiple') {
                correctAnswerText.textContent = `正確答案：${question.options[question.answer]}`;
            }

            wrongAnswerDiv.appendChild(correctAnswerText);
            wrongAnswersList.appendChild(wrongAnswerDiv);
        });
    }

    // 顯示第五畫面
    showScreen(5);
}

// 更新成果區
function updateAchievementArea() {
    const starsContainer = document.getElementById('stars');

    // 清空星星容器
    starsContainer.innerHTML = '';

    // 添加星星
    for (let i = 0; i < achievedStars; i++) {
        const star = document.createElement('span');
        star.textContent = '★';
        starsContainer.appendChild(star);
    }
}
//時間格式輔助
function formatTimeHHMMSS(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

// 設置倒數計時
function setupCountdown() {
    const startTimeStr = document.getElementById('startTimeInput').value;
    // 從 radio 按鈕讀取選擇的倒數秒數
    const countdownOption = parseInt(document.querySelector('input[name="countdownOption"]:checked').value);

    if (!startTimeStr) {
        alert('請輸入開始時間');
        return;
    }

    let [inputHour, inputMinute] = startTimeStr.split(':').map(Number);
    const now = new Date();
    startTimeValue = new Date(now.getFullYear(), now.getMonth(), now.getDate(), inputHour, inputMinute);
    if (startTimeValue < now) {
        startTimeValue = now;
    }

    // 直接將選取的倒數秒數作為 totalSeconds
    totalSeconds = countdownOption;

    // 計算結束時間
    endTimeValue = new Date(startTimeValue.getTime() + totalSeconds * 1000);
    document.getElementById('startTime').textContent = formatTime(startTimeValue);
    document.getElementById('endTime').textContent = formatTime(endTimeValue);

    const delay = startTimeValue - now;
    if (delay > 0) {
        alert(`倒數將於 ${formatTime(startTimeValue)} 開始！`);
        startWaitCountdown();
    } else {
        remainingSeconds = totalSeconds;
        startCountdown();
    }
    showScreen(2);
    saveToLocalStorage();
}

let waitInterval; // 等待倒數的計時器

function startWaitCountdown() {
    waitInterval = setInterval(function () {
        const now = new Date();
        let diffSeconds = Math.floor((startTimeValue - now) / 1000);
        if (diffSeconds <= 0) {
            clearInterval(waitInterval);
            remainingSeconds = totalSeconds;
            startCountdown(); // 等待完畢，開始正式倒數
        } else {
            // 計算剩餘的總小時與分鐘（捨去秒數）
            const waitHours = Math.floor(diffSeconds / 3600);
            const waitMinutes = Math.floor((diffSeconds % 3600) / 60);
            document.getElementById('countdownValue').textContent = `剩下${waitHours}小時${waitMinutes}分鐘`;
        }
    }, 1000);
}

// 開始倒數計時
function startCountdown() {
    // 清除之前的計時器
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    // 更新倒數計時顯示
    updateCountdown();

    // 設置計時器，每秒更新一次
    countdownInterval = setInterval(function () {
        remainingSeconds--;

        // 更新倒數計時顯示
        updateCountdown();

        // 如果倒數結束，清除計時器
        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            showScreen(6);  // 加入這行，顯示第六畫面
            saveToLocalStorage(); // 保存狀態
        }
    }, 1000);
}

// 更新倒數計時顯示
function updateCountdown() {

    const countdownValue = document.getElementById('countdownValue');
    const countdownProgress = document.getElementById('countdownProgress');

    // 使用反轉公式計算進度條百分比
    const progressPercentage = (1 - (remainingSeconds / totalSeconds)) * 100;
    countdownProgress.style.width = progressPercentage + '%';

    // 根據百分比更換進度條顏色（可根據需要調整判斷邏輯）
    if (progressPercentage < 30) {
        countdownProgress.className = 'progress-bar progress-danger';
    } else if (progressPercentage < 60) {
        countdownProgress.className = 'progress-bar progress-warning';
    } else {
        countdownProgress.className = 'progress-bar progress-success';
    }

    // 計算剩餘的總小時與分鐘
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);

    // 將倒數文字更新為「剩下 X 小時 Y 分鐘」
    countdownValue.textContent = `剩下${hours}小時${minutes}分鐘`;
}

// 格式化時間為 HH:MM 格式
function formatTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
}

// 顯示指定畫面，隱藏其他畫面
function showScreen(screenNumber) {
    // 假設目前有六個畫面，則將迴圈從 1 執行到 6
    for (let i = 1; i <= 6; i++) {
        const screen = document.getElementById(`screen${i}`);
        if (screen) { // 確保該畫面存在
            screen.classList.add('d-none');
        }
    }

    // 顯示指定畫面
    const targetScreen = document.getElementById(`screen${screenNumber}`);
    if (targetScreen) {
        targetScreen.classList.remove('d-none');
    }

    // 更新當前畫面變數
    currentScreen = screenNumber;

    // 控制倒數區塊的顯示或隱藏
    const countdownContainer = document.querySelector('.countdown-container');
    const logo_S = document.querySelector('.logo-sm');
    if (countdownContainer) {
        // 當畫面是 1 或 6 時，隱藏倒數區塊，否則顯示
        if (screenNumber === 1 || screenNumber === 6) {
            countdownContainer.style.display = 'none';
            logo_S.classList.add('d-none');
            logo_S.classList.remove('d-block');
        } else {
            countdownContainer.style.display = 'block';
            logo_S.classList.remove('d-none');
            logo_S.classList.add('d-block');
            // 🔥 加入此行: 如果是在倒數畫面(2)，立即更新倒數顯示
            if (screenNumber === 2) {
                updateCountdown();
            }
        }
    }
}

function clearLocalStorage() {
    try {
        // 重置單位與衛教內容下拉選單
        const unitSelect = document.getElementById('unit');
        unitSelect.selectedIndex = 0;
        const eduContentSelect = document.getElementById('eduContent');
        eduContentSelect.innerHTML = '<option value="" selected disabled>請先選擇單位</option>';

        localStorage.removeItem(STORAGE_KEY);

        // 重置全域變數
        achievedStars = 0;
        completedEduContents = [];

        // 清除倒數計時
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }

        // 重設表單欄位：我們希望 startTimeInput 顯示當下時間
        setCurrentTime();  // 呼叫設定目前時間的函式



        // 更新成果區（清除星星）
        updateAchievementArea();



        console.log('數據已從 localStorage 清除');
        alert('所有數據已重置！');
    } catch (error) {
        console.error('清除 localStorage 數據時出錯:', error);
    }
}
