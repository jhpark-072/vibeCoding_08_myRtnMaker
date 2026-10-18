/**
 * ==========================================================================
 * 🔥 PULSE TIMER: Sporty Dynamic Workout Planner & Interval Timer
 * ==========================================================================
 */

// ==========================================================================
// 1. Web Audio API 신디사이저 모듈 (외부 음원 파일 없는 순수 코드 비프음)
// ==========================================================================
class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.isEnabled = true;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSound() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  // 3초, 2초, 1초 전 카운트다운 단음 (Short Beep: 880Hz, 120ms)
  playWarningBeep() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5

      gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // 라운드/단계 전환 및 운동 시작음 (Long Beep: 1200Hz, 500ms)
  playStartBeep() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // 루틴 완주 축하 팡파르 (도-미-솔-도 아르페지오)
  playVictoryFanfare() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.audioCtx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

          gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.35);
        } catch (e) {}
      }, idx * 160);
    });
  }
}

// ==========================================================================
// 2. 기본 프리셋 및 루틴 저장소 관리자 (LocalStorage Manager)
// ==========================================================================
const DEFAULT_PRESETS = [
  {
    id: 'preset_tabata_starter',
    title: '⚡ 4분 초보자 타바타',
    readyTime: 5,
    stages: [
      { id: 'stg_1', name: '점핑 잭 (Jumping Jacks)', type: 'tabata', workTime: 20, restTime: 10, rounds: 4 },
      { id: 'stg_2', name: '바디웨이트 스쿼트 (Squats)', type: 'tabata', workTime: 20, restTime: 10, rounds: 4 }
    ]
  },
  {
    id: 'preset_fullbody_hiit',
    title: '🔥 고강도 전신 인터벌 (HIIT)',
    readyTime: 5,
    stages: [
      { id: 'stg_h1', name: '버피 테스트 (Burpees)', type: 'countdown', workTime: 30, restTime: 15, rounds: 3 },
      { id: 'stg_h2', name: '마운틴 클라이머 (Mountain Climbers)', type: 'countdown', workTime: 30, restTime: 15, rounds: 3 },
      { id: 'stg_h3', name: '플랭크 홀드 (Plank Hold)', type: 'countup', workTime: 40, restTime: 20, rounds: 2 }
    ]
  }
];

class RoutineStorage {
  constructor() {
    this.STORAGE_KEY = 'workout_routines_v2';
    this.routines = this.loadAll();
  }

  loadAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
    // 데이터가 없으면 기본 프리셋 복사 후 저장
    this.saveAll(DEFAULT_PRESETS);
    return JSON.parse(JSON.stringify(DEFAULT_PRESETS));
  }

  saveAll(list) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      this.routines = list;
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  }

  saveRoutine(newRoutine) {
    const existingIdx = this.routines.findIndex(r => r.id === newRoutine.id);
    if (existingIdx >= 0) {
      this.routines[existingIdx] = newRoutine;
    } else {
      this.routines.push(newRoutine);
    }
    this.saveAll(this.routines);
  }

  deleteRoutine(id) {
    this.routines = this.routines.filter(r => r.id !== id);
    if (this.routines.length === 0) {
      this.routines = JSON.parse(JSON.stringify(DEFAULT_PRESETS));
    }
    this.saveAll(this.routines);
  }
}

// ==========================================================================
// 3. 타이머 상태 머신 & 고정밀 시퀀스 엔진 (Timer Sequence Engine)
// ==========================================================================
class WorkoutTimerEngine {
  constructor(soundManager, onTickCallback, onStateChangeCallback, onCompleteCallback) {
    this.sound = soundManager;
    this.onTick = onTickCallback;
    this.onStateChange = onStateChangeCallback;
    this.onComplete = onCompleteCallback;

    // 런타임 상태
    this.routine = null;
    this.currentStageIndex = 0;
    this.currentRound = 1;
    this.phase = 'IDLE'; // IDLE, READY, WORK, REST, COMPLETED
    this.remainingSeconds = 0;
    this.targetSeconds = 0;
    this.isRunning = false;
    this.isPaused = false;

    // 정밀 타이머 계산용
    this.timerId = null;
    this.lastTimestamp = null;
    this.accumulatedMs = 0;
    this.lastBeepSecond = -1; // 동일 초 중복 비프음 방지

    // 화면 꺼짐 방지 객체
    this.wakeLock = null;
  }

  loadRoutine(routine) {
    this.reset();
    this.routine = JSON.parse(JSON.stringify(routine));
    this.currentStageIndex = 0;
    this.currentRound = 1;
    this.phase = 'IDLE';

    const firstStage = this.getCurrentStage();
    if (firstStage) {
      this.remainingSeconds = firstStage.workTime;
    } else {
      this.remainingSeconds = 0;
    }
    this.notifyStateChange();
    this.notifyTick();
  }

  getCurrentStage() {
    if (!this.routine || !this.routine.stages || this.routine.stages.length === 0) return null;
    return this.routine.stages[this.currentStageIndex] || null;
  }

  getNextStagePreview() {
    if (!this.routine || !this.routine.stages) return null;
    return this.routine.stages[this.currentStageIndex + 1] || null;
  }

  // 시작 / 일시정지 토글
  togglePlayPause() {
    this.sound.init(); // 유저 인터랙션으로 오디오 컨텍스트 언락

    if (!this.routine || !this.routine.stages || this.routine.stages.length === 0) {
      alert('운동 단계를 1개 이상 추가해 주세요.');
      return;
    }

    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.phase === 'COMPLETED') {
      this.reset();
    }

    this.isRunning = true;
    this.isPaused = false;
    this.requestWakeLock();

    // 초기 시작인 경우 대기 시간(READY)으로 진입
    if (this.phase === 'IDLE') {
      const readyTime = parseInt(this.routine.readyTime, 10) || 5;
      if (readyTime > 0) {
        this.phase = 'READY';
        this.remainingSeconds = readyTime;
      } else {
        this.phase = 'WORK';
        const stg = this.getCurrentStage();
        this.remainingSeconds = stg ? stg.workTime : 30;
        this.sound.playStartBeep();
      }
    }

    this.lastTimestamp = performance.now();
    this.accumulatedMs = 0;
    this.lastBeepSecond = -1;
    this.startLoop();
    this.notifyStateChange();
    this.notifyTick();
  }

  pause() {
    this.isRunning = false;
    this.isPaused = true;
    this.stopLoop();
    this.releaseWakeLock();
    this.notifyStateChange();
  }

  reset() {
    this.stopLoop();
    this.isRunning = false;
    this.isPaused = false;
    this.releaseWakeLock();

    this.currentStageIndex = 0;
    this.currentRound = 1;
    this.phase = 'IDLE';

    const firstStage = this.getCurrentStage();
    this.remainingSeconds = firstStage ? firstStage.workTime : 0;
    this.lastBeepSecond = -1;

    this.notifyStateChange();
    this.notifyTick();
  }

  // ★ 요구사항 2: [다음] 버튼을 누르면 다음 스테이지로 즉시 이동
  skipToNextStage() {
    if (!this.routine || !this.routine.stages) return;

    if (this.currentStageIndex < this.routine.stages.length - 1) {
      this.currentStageIndex++;
      this.currentRound = 1;
      this.phase = 'WORK';
      const stg = this.getCurrentStage();
      this.remainingSeconds = stg ? stg.workTime : 30;
      this.lastBeepSecond = -1;

      this.sound.playStartBeep();
      this.notifyStateChange();
      this.notifyTick();
    } else {
      // 마지막 스테이지에서 다음을 누르면 완주 처리
      this.completeRoutine();
    }
  }

  // 이전 스테이지 이동
  skipToPrevStage() {
    if (!this.routine || !this.routine.stages) return;

    if (this.currentStageIndex > 0) {
      this.currentStageIndex--;
      this.currentRound = 1;
      this.phase = 'WORK';
      const stg = this.getCurrentStage();
      this.remainingSeconds = stg ? stg.workTime : 30;
      this.lastBeepSecond = -1;

      this.sound.playStartBeep();
      this.notifyStateChange();
      this.notifyTick();
    } else {
      this.reset();
    }
  }

  startLoop() {
    this.stopLoop();
    this.timerId = setInterval(() => this.tick(), 50);
  }

  stopLoop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  // Delta 정밀 틱 처리
  tick() {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = now - this.lastTimestamp;
    this.lastTimestamp = now;
    this.accumulatedMs += delta;

    while (this.accumulatedMs >= 1000) {
      this.accumulatedMs -= 1000;
      this.handleOneSecond();
    }

    this.notifyTick();
  }

  handleOneSecond() {
    const stage = this.getCurrentStage();
    if (!stage && this.phase !== 'READY') return;

    // 카운트업 타입(countup) 처리 분기
    const isCountUp = stage && stage.type === 'countup' && this.phase === 'WORK';

    if (isCountUp) {
      this.remainingSeconds++;
      const targetTime = stage.workTime;
      const leftToTarget = targetTime - this.remainingSeconds;

      // 3초 전 비프음
      if (leftToTarget <= 3 && leftToTarget > 0 && leftToTarget !== this.lastBeepSecond) {
        this.sound.playWarningBeep();
        this.lastBeepSecond = leftToTarget;
      }

      if (this.remainingSeconds >= targetTime) {
        this.transitionNextPhase();
      }
    } else {
      // 카운트다운(기본 시간제한, 타바타, 대기시간, 휴식시간)
      this.remainingSeconds--;

      // 3초, 2초, 1초 전 비프음
      if (this.remainingSeconds <= 3 && this.remainingSeconds > 0 && this.remainingSeconds !== this.lastBeepSecond) {
        this.sound.playWarningBeep();
        this.lastBeepSecond = this.remainingSeconds;
      }

      if (this.remainingSeconds <= 0) {
        this.transitionNextPhase();
      }
    }
  }

  // 상태 머신 전이 로직 (READY -> WORK <-> REST -> NEXT STAGE -> COMPLETED)
  transitionNextPhase() {
    this.lastBeepSecond = -1;
    const stage = this.getCurrentStage();

    if (this.phase === 'READY') {
      // 대기 시간 끝 -> 1단계 1라운드 운동 시작
      this.phase = 'WORK';
      this.currentRound = 1;
      this.remainingSeconds = stage ? (stage.type === 'countup' ? 0 : stage.workTime) : 30;
      this.sound.playStartBeep();
      this.notifyStateChange();
      return;
    }

    if (this.phase === 'WORK') {
      // 운동 시간 종료
      const restTime = parseInt(stage.restTime, 10) || 0;
      if (restTime > 0) {
        // 휴식 시간으로 전이
        this.phase = 'REST';
        this.remainingSeconds = restTime;
        this.sound.playStartBeep();
      } else {
        // 휴식 시간이 없으면 바로 다음 라운드 또는 다음 스테이지로
        this.advanceRoundOrStage();
      }
      this.notifyStateChange();
      return;
    }

    if (this.phase === 'REST') {
      // 휴식 시간 종료 -> 다음 라운드 또는 다음 스테이지로
      this.advanceRoundOrStage();
      this.notifyStateChange();
      return;
    }
  }

  advanceRoundOrStage() {
    const stage = this.getCurrentStage();
    if (!stage) return;

    if (this.currentRound < stage.rounds) {
      // 다음 라운드 계속 진행
      this.currentRound++;
      this.phase = 'WORK';
      this.remainingSeconds = stage.type === 'countup' ? 0 : stage.workTime;
      this.sound.playStartBeep();
    } else {
      // 해당 스테이지 모든 라운드 종료 -> 다음 스테이지로 자동 전이
      if (this.currentStageIndex < this.routine.stages.length - 1) {
        this.currentStageIndex++;
        this.currentRound = 1;
        this.phase = 'WORK';
        const nextStage = this.getCurrentStage();
        this.remainingSeconds = nextStage.type === 'countup' ? 0 : nextStage.workTime;
        this.sound.playStartBeep();
      } else {
        // 모든 스테이지 완료
        this.completeRoutine();
      }
    }
  }

  completeRoutine() {
    this.stopLoop();
    this.isRunning = false;
    this.isPaused = false;
    this.phase = 'COMPLETED';
    this.remainingSeconds = 0;
    this.releaseWakeLock();
    this.sound.playVictoryFanfare();

    this.notifyStateChange();
    this.notifyTick();
    if (this.onComplete) this.onComplete();
  }

  notifyTick() {
    if (this.onTick) this.onTick(this.remainingSeconds, this.phase);
  }

  notifyStateChange() {
    if (this.onStateChange) this.onStateChange(this.phase, this.currentStageIndex, this.currentRound);
  }

  // 화면 꺼짐 방지 (Wake Lock API)
  async requestWakeLock() {
    try {
      if ('wakeLock' in navigator && !this.wakeLock) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        const badge = document.getElementById('wakeLockBadge');
        if (badge) badge.classList.remove('hidden');
      }
    } catch (err) {
      console.warn('Wake Lock request error:', err);
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release().then(() => {
        this.wakeLock = null;
        const badge = document.getElementById('wakeLockBadge');
        if (badge) badge.classList.add('hidden');
      }).catch(() => {});
    }
  }
}

// ==========================================================================
// 4. UI 렌더링 및 이벤트 바인딩 (UI Controller)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  const soundManager = new SoundManager();
  const storage = new RoutineStorage();

  // DOM Elements
  const body = document.body;
  const statusBadge = document.getElementById('statusBadge');
  const currentStageName = document.getElementById('currentStageName');
  const currentRoundDisplay = document.getElementById('currentRoundDisplay');
  const roundProgressBar = document.getElementById('roundProgressBar');
  const mainTimerDisplay = document.getElementById('mainTimerDisplay');
  const timerSubLabel = document.getElementById('timerSubLabel');
  const nextStageText = document.getElementById('nextStageText');

  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const playPauseText = document.getElementById('playPauseText');
  const btnReset = document.getElementById('btnReset');
  const btnPrevStage = document.getElementById('btnPrevStage');
  const btnNextStage = document.getElementById('btnNextStage');

  const routineSelect = document.getElementById('routineSelect');
  const btnSaveRoutine = document.getElementById('btnSaveRoutine');
  const btnDeleteRoutine = document.getElementById('btnDeleteRoutine');
  const inputReadyTime = document.getElementById('inputReadyTime');
  const routineTotalTime = document.getElementById('routineTotalTime');
  const stageListContainer = document.getElementById('stageListContainer');
  const btnAddStage = document.getElementById('btnAddStage');

  const btnToggleBuilder = document.getElementById('btnToggleBuilder');
  const builderContent = document.getElementById('builderContent');
  const toggleBuilderText = document.getElementById('toggleBuilderText');

  const saveModal = document.getElementById('saveModal');
  const inputRoutineName = document.getElementById('inputRoutineName');
  const btnModalCancel = document.getElementById('btnModalCancel');
  const btnModalConfirm = document.getElementById('btnModalConfirm');

  const completedOverlay = document.getElementById('completedOverlay');
  const completedStats = document.getElementById('completedStats');
  const btnCompletedClose = document.getElementById('btnCompletedClose');

  // 활성 루틴 상태
  let activeRoutine = JSON.parse(JSON.stringify(storage.routines[0]));

  // 타이머 엔진 인스턴스 생성
  const timerEngine = new WorkoutTimerEngine(
    soundManager,
    onTimerTick,
    onTimerStateChange,
    onWorkoutCompleted
  );

  // 시간 포맷 헬퍼 (MM:SS)
  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const remSec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
  }

  // 1. 타이머 틱 콜백 (실시간 디스플레이 갱신)
  function onTimerTick(seconds, phase) {
    mainTimerDisplay.textContent = formatTime(seconds);

    const stage = timerEngine.getCurrentStage();
    if (!stage) return;

    if (phase === 'WORK') {
      const total = stage.workTime;
      const progress = stage.type === 'countup' ? (seconds / total) * 100 : ((total - seconds) / total) * 100;
      roundProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    } else if (phase === 'REST') {
      const total = stage.restTime;
      const progress = ((total - seconds) / total) * 100;
      roundProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    } else if (phase === 'READY') {
      const total = parseInt(activeRoutine.readyTime, 10) || 5;
      const progress = ((total - seconds) / total) * 100;
      roundProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
  }

  // 2. 타이머 상태 변경 콜백 (테마 및 뱃지 실시간 전환)
  function onTimerStateChange(phase, stageIdx, round) {
    // 배경 테마 초기화
    body.classList.remove('theme-idle', 'theme-ready', 'theme-work', 'theme-rest');

    const stage = timerEngine.getCurrentStage();
    const nextStage = timerEngine.getNextStagePreview();

    // 플레이/일시정지 버튼 상태 갱신
    if (timerEngine.isRunning) {
      btnPlayPause.classList.add('is-running');
      btnPlayPause.classList.remove('is-paused');
      playPauseIcon.textContent = '⏸';
      playPauseText.textContent = '일시정지';
    } else if (timerEngine.isPaused) {
      btnPlayPause.classList.remove('is-running');
      btnPlayPause.classList.add('is-paused');
      playPauseIcon.textContent = '▶';
      playPauseText.textContent = '재개';
    } else {
      btnPlayPause.classList.remove('is-running', 'is-paused');
      playPauseIcon.textContent = '▶';
      playPauseText.textContent = '시작';
    }

    // 상태별 디스플레이 분기
    switch (phase) {
      case 'READY':
        body.classList.add('theme-ready');
        statusBadge.textContent = '준비 중 (GET READY)';
        currentStageName.textContent = stage ? `${stage.name} 시작 준비` : '준비';
        currentRoundDisplay.textContent = `1 / ${stage ? stage.rounds : 1}`;
        timerSubLabel.textContent = '준비 카운트다운';
        break;

      case 'WORK':
        body.classList.add('theme-work');
        statusBadge.textContent = '운동 중 (WORK)';
        currentStageName.textContent = stage.name;
        currentRoundDisplay.textContent = `${round} / ${stage.rounds}`;
        timerSubLabel.textContent = stage.type === 'countup' ? '경과 시간' : '남은 운동 시간';
        break;

      case 'REST':
        body.classList.add('theme-rest');
        statusBadge.textContent = '휴식 중 (REST)';
        currentStageName.textContent = `휴식 (${stage.name})`;
        currentRoundDisplay.textContent = `${round} / ${stage.rounds}`;
        timerSubLabel.textContent = '남은 휴식 시간';
        break;

      case 'COMPLETED':
        body.classList.add('theme-ready');
        statusBadge.textContent = '루틴 완주! (COMPLETED)';
        currentStageName.textContent = '완벽한 루틴 완료!';
        currentRoundDisplay.textContent = 'DONE';
        timerSubLabel.textContent = '축하합니다!';
        break;

      case 'IDLE':
      default:
        body.classList.add('theme-idle');
        statusBadge.textContent = '대기 중 (IDLE)';
        currentStageName.textContent = stage ? stage.name : '운동 단계 없음';
        currentRoundDisplay.textContent = `1 / ${stage ? stage.rounds : 0}`;
        timerSubLabel.textContent = '시작 버튼을 누르세요';
        roundProgressBar.style.width = '0%';
        break;
    }

    // Next 운동 미리보기 갱신
    if (phase === 'COMPLETED') {
      nextStageText.textContent = '모든 운동 완료';
    } else if (nextStage) {
      nextStageText.textContent = `${nextStage.name} (${nextStage.workTime}초 / ${nextStage.rounds}R)`;
    } else if (stage) {
      if (round < stage.rounds) {
        nextStageText.textContent = `${stage.name} 다음 라운드 (${round + 1}/${stage.rounds})`;
      } else {
        nextStageText.textContent = '마지막 단계입니다';
      }
    } else {
      nextStageText.textContent = '-';
    }

    // 활성 카드 하이라이트
    renderStageCardsHighlight(stageIdx);
  }

  // 3. 완주 모달 콜백
  function onWorkoutCompleted() {
    const totalSecs = calculateTotalRoutineTime(activeRoutine);
    completedStats.innerHTML = `
      <div>총 소요 시간<strong>${formatTime(totalSecs)}</strong></div>
      <div>수행한 단계<strong>${activeRoutine.stages.length}개</strong></div>
    `;
    completedOverlay.classList.remove('hidden');
  }

  // 전체 예상 소요 시간 계산
  function calculateTotalRoutineTime(routine) {
    if (!routine || !routine.stages) return 0;
    let total = parseInt(routine.readyTime, 10) || 0;
    routine.stages.forEach(stg => {
      const rounds = parseInt(stg.rounds, 10) || 1;
      const work = parseInt(stg.workTime, 10) || 0;
      const rest = parseInt(stg.restTime, 10) || 0;
      total += (work * rounds) + (rest * Math.max(0, rounds));
    });
    return total;
  }

  function updateTotalTimeBadge() {
    const total = calculateTotalRoutineTime(activeRoutine);
    const span = routineTotalTime.querySelector('span');
    if (span) span.textContent = formatTime(total);
  }

  // 루틴 드롭다운 렌더링
  function renderRoutineDropdown() {
    routineSelect.innerHTML = '';
    storage.routines.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.title;
      if (r.id === activeRoutine.id) opt.selected = true;
      routineSelect.appendChild(opt);
    });
  }

  // 스테이지 카드 렌더링
  function renderStageCards() {
    stageListContainer.innerHTML = '';

    if (!activeRoutine.stages || activeRoutine.stages.length === 0) {
      stageListContainer.innerHTML = `
        <div style="text-align:center; padding: 20px; color: var(--text-muted); font-size: 0.9rem;">
          등록된 운동 단계가 없습니다. 아래 버튼을 눌러 추가해 보세요.
        </div>
      `;
      updateTotalTimeBadge();
      return;
    }

    activeRoutine.stages.forEach((stage, idx) => {
      const card = document.createElement('div');
      card.className = 'stage-card';
      card.dataset.index = idx;

      card.innerHTML = `
        <div class="stage-card-header">
          <span class="stage-badge-num">STAGE ${idx + 1}</span>
          <div class="stage-card-actions">
            <button class="btn-card-action btn-move-up" title="위로 이동" ${idx === 0 ? 'disabled' : ''}>▲</button>
            <button class="btn-card-action btn-move-down" title="아래로 이동" ${idx === activeRoutine.stages.length - 1 ? 'disabled' : ''}>▼</button>
            <button class="btn-card-action btn-del-card" title="단계 삭제">✕</button>
          </div>
        </div>

        <div class="stage-form-grid">
          <div class="stage-input-group">
            <label>운동 이름</label>
            <input type="text" class="stage-input-text input-stage-name" value="${stage.name}">
          </div>
          <div class="stage-input-group">
            <label>타입 선택</label>
            <select class="stage-select-type select-stage-type">
              <option value="countdown" ${stage.type === 'countdown' ? 'selected' : ''}>시간제한 (Count Down)</option>
              <option value="tabata" ${stage.type === 'tabata' ? 'selected' : ''}>타바타 (Tabata Set)</option>
              <option value="countup" ${stage.type === 'countup' ? 'selected' : ''}>랩 타임 (Count Up)</option>
            </select>
          </div>
        </div>

        <div class="stage-num-grid">
          <div class="num-input-box highlight-work">
            <span class="num-label">운동 시간(초)</span>
            <input type="number" class="input-work-time" min="1" max="999" value="${stage.workTime}">
          </div>
          <div class="num-input-box highlight-rest">
            <span class="num-label">휴식 시간(초)</span>
            <input type="number" class="input-rest-time" min="0" max="999" value="${stage.restTime || 0}">
          </div>
          <div class="num-input-box">
            <span class="num-label">라운드 수</span>
            <input type="number" class="input-rounds" min="1" max="99" value="${stage.rounds}">
          </div>
        </div>
      `;

      // 입력 이벤트 바인딩
      const inputName = card.querySelector('.input-stage-name');
      const selectType = card.querySelector('.select-stage-type');
      const inputWork = card.querySelector('.input-work-time');
      const inputRest = card.querySelector('.input-rest-time');
      const inputRounds = card.querySelector('.input-rounds');

      const updateData = () => {
        stage.name = inputName.value.trim() || `운동 ${idx + 1}`;
        stage.type = selectType.value;
        stage.workTime = Math.max(1, parseInt(inputWork.value, 10) || 10);
        stage.restTime = Math.max(0, parseInt(inputRest.value, 10) || 0);
        stage.rounds = Math.max(1, parseInt(inputRounds.value, 10) || 1);

        updateTotalTimeBadge();
        if (!timerEngine.isRunning) {
          timerEngine.loadRoutine(activeRoutine);
        }
      };

      inputName.addEventListener('change', updateData);
      selectType.addEventListener('change', updateData);
      inputWork.addEventListener('change', updateData);
      inputRest.addEventListener('change', updateData);
      inputRounds.addEventListener('change', updateData);

      // 이동 및 삭제 버튼
      card.querySelector('.btn-move-up').addEventListener('click', () => {
        if (idx > 0) {
          const temp = activeRoutine.stages[idx];
          activeRoutine.stages[idx] = activeRoutine.stages[idx - 1];
          activeRoutine.stages[idx - 1] = temp;
          refreshRoutine();
        }
      });

      card.querySelector('.btn-move-down').addEventListener('click', () => {
        if (idx < activeRoutine.stages.length - 1) {
          const temp = activeRoutine.stages[idx];
          activeRoutine.stages[idx] = activeRoutine.stages[idx + 1];
          activeRoutine.stages[idx + 1] = temp;
          refreshRoutine();
        }
      });

      card.querySelector('.btn-del-card').addEventListener('click', () => {
        activeRoutine.stages.splice(idx, 1);
        refreshRoutine();
      });

      stageListContainer.appendChild(card);
    });

    updateTotalTimeBadge();
    renderStageCardsHighlight(timerEngine.currentStageIndex);
  }

  function renderStageCardsHighlight(activeIdx) {
    const cards = stageListContainer.querySelectorAll('.stage-card');
    cards.forEach((card, idx) => {
      if (idx === activeIdx && timerEngine.isRunning) {
        card.classList.add('is-active-stage');
      } else {
        card.classList.remove('is-active-stage');
      }
    });
  }

  function refreshRoutine() {
    renderStageCards();
    updateTotalTimeBadge();
    timerEngine.loadRoutine(activeRoutine);
  }

  // ==========================================================================
  // 5. 버튼 인터랙션 리스너 등록
  // ==========================================================================

  // 사운드 토글
  btnSoundToggle.addEventListener('click', () => {
    const isEnabled = soundManager.toggleSound();
    btnSoundToggle.classList.toggle('active', isEnabled);
    btnSoundToggle.querySelector('.btn-text').textContent = isEnabled ? '소리 ON' : '소리 OFF';
    btnSoundToggle.querySelector('.btn-icon').textContent = isEnabled ? '🔊' : '🔇';
  });

  // 전체화면 토글
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // 시작 / 일시정지
  btnPlayPause.addEventListener('click', () => {
    timerEngine.togglePlayPause();
  });

  // 리셋
  btnReset.addEventListener('click', () => {
    timerEngine.reset();
  });

  // ★ 요구사항 2: 다음 단계로 즉시 이동
  btnNextStage.addEventListener('click', () => {
    timerEngine.skipToNextStage();
  });

  // 이전 단계 이동
  btnPrevStage.addEventListener('click', () => {
    timerEngine.skipToPrevStage();
  });

  // 새 운동 단계 동적 추가
  btnAddStage.addEventListener('click', () => {
    const newStageNumber = activeRoutine.stages.length + 1;
    activeRoutine.stages.push({
      id: 'stg_' + Date.now(),
      name: `운동 ${newStageNumber}`,
      type: 'countdown',
      workTime: 30,
      restTime: 15,
      rounds: 3
    });
    refreshRoutine();
  });

  // 대기 시간 입력 변경
  inputReadyTime.addEventListener('change', () => {
    activeRoutine.readyTime = Math.max(0, parseInt(inputReadyTime.value, 10) || 5);
    updateTotalTimeBadge();
    if (!timerEngine.isRunning) {
      timerEngine.loadRoutine(activeRoutine);
    }
  });

  // 빌더 접기/펼치기 토글
  btnToggleBuilder.addEventListener('click', () => {
    const isCollapsed = builderContent.classList.toggle('collapsed');
    toggleBuilderText.textContent = isCollapsed ? '펼치기' : '접기';
    btnToggleBuilder.setAttribute('aria-expanded', !isCollapsed);
    btnToggleBuilder.innerHTML = isCollapsed ? '<span id="toggleBuilderText">펼치기</span> ▼' : '<span id="toggleBuilderText">접기</span> ▲';
  });

  // 루틴 드롭다운 선택 변경
  routineSelect.addEventListener('change', () => {
    const selected = storage.routines.find(r => r.id === routineSelect.value);
    if (selected) {
      activeRoutine = JSON.parse(JSON.stringify(selected));
      inputReadyTime.value = activeRoutine.readyTime || 5;
      refreshRoutine();
    }
  });

  // 루틴 저장 모달 열기
  btnSaveRoutine.addEventListener('click', () => {
    inputRoutineName.value = activeRoutine.title || '새 커스텀 루틴';
    saveModal.classList.remove('hidden');
    inputRoutineName.focus();
  });

  btnModalCancel.addEventListener('click', () => {
    saveModal.classList.add('hidden');
  });

  btnModalConfirm.addEventListener('click', () => {
    const title = inputRoutineName.value.trim() || '나만의 운동 루틴';
    activeRoutine.title = title;
    activeRoutine.id = 'routine_' + Date.now();
    storage.saveRoutine(activeRoutine);
    renderRoutineDropdown();
    saveModal.classList.add('hidden');
    alert(`"${title}" 루틴이 브라우저에 안전하게 저장되었습니다!`);
  });

  // 루틴 삭제
  btnDeleteRoutine.addEventListener('click', () => {
    if (confirm(`현재 선택된 "${activeRoutine.title}" 루틴을 삭제하시겠습니까?`)) {
      storage.deleteRoutine(activeRoutine.id);
      activeRoutine = JSON.parse(JSON.stringify(storage.routines[0]));
      renderRoutineDropdown();
      inputReadyTime.value = activeRoutine.readyTime || 5;
      refreshRoutine();
    }
  });

  // 완주 모달 닫기
  btnCompletedClose.addEventListener('click', () => {
    completedOverlay.classList.add('hidden');
    timerEngine.reset();
  });

  // ==========================================================================
  // 초기화 실행
  // ==========================================================================
  inputReadyTime.value = activeRoutine.readyTime || 5;
  renderRoutineDropdown();
  renderStageCards();
  timerEngine.loadRoutine(activeRoutine);
});
