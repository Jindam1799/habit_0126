document.addEventListener('DOMContentLoaded', function () {
  // DOM 요소 참조
  const dayButtons = document.querySelector('.day-buttons');
  const gameArea = document.getElementById('game-area');
  const previewPopup = document.getElementById('preview-popup');
  const previewKoreanArea = document.getElementById('preview-korean-area');
  const closePreviewBtn = document.getElementById('close-preview');
  const koreanSentence = document.getElementById('korean-sentence');
  const sentenceDisplay = document.querySelector('.sentence-display');
  const availableCards = document.getElementById('available-cards');
  const placedCards = document.getElementById('placed-cards');
  const checkButton = document.getElementById('check-button');
  const resetButton = document.getElementById('reset-button');
  const progressBar = document.querySelector('.progress');
  const sentenceCountSpan = document.getElementById('sentence-count');
  const timeLeftSpan = document.getElementById('time-left');

  // 게임 상태 변수
  let currentWeek = 1;
  let currentSentenceIndex = 0;
  let currentLevelIndex = 0;
  let currentSentences = [];
  let currentLevels = [];
  let selectedCards = [];
  let timer = null;
  let timeRemaining = 30;
  let isPreviewShown = false;

  // 1. Week 선택 버튼 생성 (1~4주)
  function createWeekButtons() {
    dayButtons.innerHTML = '';
    for (let i = 1; i <= 4; i++) {
      const btn = document.createElement('button');
      btn.className = 'day-button';
      btn.textContent = `Week ${i}`;
      btn.onclick = () => startWeek(i);
      dayButtons.appendChild(btn);
    }
  }

  // 2. 주차 시작
  function startWeek(week) {
    currentWeek = week;
    const data = window.sentenceData[`week${week}`];
    if (!data) return alert('해당 주차의 데이터가 없습니다.');

    prepareSentences(data);
    document.getElementById('day-selection').classList.add('hidden');
    gameArea.classList.remove('hidden');

    currentSentenceIndex = 0;
    currentLevelIndex = 0;
    isPreviewShown = false;
    loadSentence();
  }

  // 3. 문장 데이터 그룹화
  function prepareSentences(sentences) {
    const map = {};
    sentences.forEach((s) => {
      if (!map[s.id]) map[s.id] = [];
      map[s.id].push(s);
    });
    currentSentences = Object.values(map).map((group) =>
      group.sort((a, b) => a.level - b.level)
    );
  }

  // 4. 현재 단계 로드
  function loadSentence() {
    if (currentSentenceIndex >= currentSentences.length) {
      showReviewPopup();
      return;
    }

    currentLevels = currentSentences[currentSentenceIndex];

    if (currentLevelIndex === 0 && !isPreviewShown) {
      showSetPreview();
      return;
    }

    const sentence = currentLevels[currentLevelIndex];
    koreanSentence.textContent = sentence.korean;

    if (sentence.isFinal) {
      koreanSentence.classList.add('final-sentence');
      sentenceCountSpan.innerHTML = `<span style="font-weight: 800; color: #e65100;">🔥 완성 문장 도전!</span>`;
    } else {
      koreanSentence.classList.remove('final-sentence');
      sentenceCountSpan.textContent = `🧱 덩어리 훈련 중...`;
    }

    document.getElementById('current-day').textContent = `Week ${currentWeek}`;
    updateProgress();
    createCards(sentence);
    startTimer();
  }

  // 5. 미리보기 팝업 (한국어만)
  function showSetPreview() {
    clearInterval(timer);
    const finals = currentLevels.filter((l) => l.isFinal);

    previewKoreanArea.innerHTML = '';
    document.getElementById('preview-title').textContent = `완성문장 ${
      currentSentenceIndex + 1
    }`;

    finals.forEach((s) => {
      const p = document.createElement('div');
      p.style.marginBottom = '8px';
      p.innerHTML = s.korean.replace(
        /^(A:|B:)/,
        '<strong style="color:#e65100;">$1</strong>'
      );
      previewKoreanArea.appendChild(p);
    });

    previewPopup.classList.remove('hidden');
    isPreviewShown = true;
  }

  closePreviewBtn.onclick = () => {
    previewPopup.classList.add('hidden');
    loadSentence();
  };

  // 6. 카드 생성
  function createCards(sentence) {
    availableCards.innerHTML = '';
    placedCards.innerHTML = '';
    selectedCards = [];
    const hanzi = [...sentence.chinese.hanzi];
    const pinyin = [...sentence.chinese.pinyin];

    for (let i = hanzi.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hanzi[i], hanzi[j]] = [hanzi[j], hanzi[i]];
      [pinyin[i], pinyin[j]] = [pinyin[j], pinyin[i]];
    }

    hanzi.forEach((h, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<span class="hanzi">${h}</span><span class="pinyin">${pinyin[i]}</span>`;
      card.onclick = () => {
        if (card.parentElement === availableCards) {
          placedCards.appendChild(card);
          selectedCards.push(h);
        } else {
          availableCards.appendChild(card);
          const idx = selectedCards.indexOf(h);
          if (idx > -1) selectedCards.splice(idx, 1);
        }
      };
      availableCards.appendChild(card);
    });
  }

  // 7. 정답 확인
  checkButton.onclick = () => {
    const correct = currentLevels[currentLevelIndex].chinese.hanzi;
    if (JSON.stringify(selectedCards) === JSON.stringify(correct)) {
      if (currentLevelIndex < currentLevels.length - 1) {
        currentLevelIndex++;
      } else {
        currentLevelIndex = 0;
        currentSentenceIndex++;
        isPreviewShown = false;
      }
      loadSentence();
    } else {
      placedCards.classList.add('shake');
      setTimeout(() => placedCards.classList.remove('shake'), 500);
    }
  };

  // 8. 타이머 (시간 초과 시 흔들기 애니메이션 후 리셋)
  function startTimer() {
    clearInterval(timer);
    timeRemaining = 30;
    timeLeftSpan.textContent = timeRemaining;
    timer = setInterval(() => {
      timeRemaining--;
      timeLeftSpan.textContent = timeRemaining;

      if (timeRemaining <= 0) {
        clearInterval(timer);

        // --- [추가] 시간 초과 시 화면 흔들기 효과 ---
        gameArea.classList.add('shake');

        // 애니메이션이 끝난 후(0.5초 뒤) 클래스 제거 및 리셋
        setTimeout(() => {
          gameArea.classList.remove('shake');
          loadSentence();
        }, 500);
        // ------------------------------------------
      }
    }, 1000);
  }

  // 9. 기타 기능
  resetButton.onclick = () => createCards(currentLevels[currentLevelIndex]);

  function updateProgress() {
    const percent = (currentSentenceIndex / currentSentences.length) * 100;
    progressBar.style.width = `${percent}%`;
  }

  function showReviewPopup() {
    clearInterval(timer);
    gameArea.classList.add('hidden');
    document.getElementById('day-number').textContent = currentWeek;
    const reviewArea = document.getElementById('review-sentences');
    reviewArea.innerHTML = '';
    currentSentences.forEach((set) => {
      const setDiv = document.createElement('div');
      setDiv.style.marginBottom = '15px';
      setDiv.style.padding = '10px';
      setDiv.style.borderBottom = '1px dashed #ffb74d';
      const finals = set.filter((l) => l.isFinal);
      finals.forEach((f) => {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${
          f.korean
        }</strong><br><span style="color:#e65100;">${f.chinese.hanzi.join(
          ''
        )}</span>`;
        setDiv.appendChild(p);
      });
      reviewArea.appendChild(setDiv);
    });
    document.getElementById('review-popup').classList.remove('hidden');
  }

  // 10. 초기 시작 설정
  document.getElementById('start-game').onclick = () => {
    document.getElementById('intro-popup').classList.add('hidden');
    document.getElementById('day-selection').classList.remove('hidden');
  };

  document.getElementById('finish-review').onclick = () => {
    location.reload();
  };

  createWeekButtons();
});
