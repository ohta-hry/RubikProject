import { RotationKeyboard } from './RotationKeyboard.js';

export const PLAYBACK_MODES = {
    SCRAMBLE: 'scramble',
    SOLVE: 'solve'
};

const AUTO_APPLY_MS = 1000;   // 入力が止まってから反映するまでの待ち時間

const MODE_LABELS = {
    [PLAYBACK_MODES.SCRAMBLE]: 'スクランブル',
    [PLAYBACK_MODES.SOLVE]: 'ソルブ'
};

export class AppControls {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.mode = PLAYBACK_MODES.SOLVE;   // 起動時はソルブ
        this.applyTimer = null;
        this.lastApplied = null;

        this.presetInput = document.getElementById('preset-input');
        this.modeToggle = document.getElementById('mode-toggle');
        this.movesInput = document.getElementById('moves-input');
        this.stageVeil = document.getElementById('stage-veil');
        this.playButton = document.getElementById('play-button');
        this.prevButton = document.getElementById('prev-button');
        this.nextButton = document.getElementById('next-button');
        this.seekBarInput = document.getElementById('seek-bar');
        this.presetToggle = document.getElementById('preset-toggle');
        this.presetBody = document.getElementById('preset-body');
        this.keyboardButton = document.getElementById('keyboard-button');
        this.actionRow = document.getElementById('action-row');
        this.keyboardPanel = document.getElementById('rotation-keyboard');
        this.keyboardClose = document.getElementById('keyboard-close');
        this.inputPage = document.getElementById('page-input');
        this.statusMessage = document.getElementById('status-message');

        this.rotationKeyboard = new RotationKeyboard({
            panel: this.keyboardPanel,
            inputs: [this.presetInput, this.movesInput],
            fallbackInput: this.movesInput,
            // 折りたたまれた先行動作欄には入力しない
            isUsable: input => input !== this.presetInput || this.presetBody.classList.contains('open')
        });

        this.#bindEvents();
        this.updateModeToggle();
    }

    #bindEvents() {
        // 改行できる入力欄：内容に合わせて高さを自動調整。
        // 変化があったら反映待ちにし、AUTO_APPLY_MS の間変化がなければ自動で反映（連続入力ではタイマーを巻き直す）
        // Ctrl/Cmd+Enter なら待たずに即反映
        [this.presetInput, this.movesInput].forEach(input => {
            input.addEventListener('input', () => {
                this.#autosize(input);
                this.#scheduleApply();
            });
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    this.#applyNow();
                }
            });
            this.#autosize(input);
        });

        // キーボードボタン：適用／キーボードボタンを隠してキーボードを出す。閉じるで元に戻る
        this.keyboardButton.addEventListener('click', () => this.setKeyboardVisible(true));
        this.keyboardClose.addEventListener('click', () => {
            this.setKeyboardVisible(false);
            this.keyboardButton.focus({ preventScroll: true });
        });

        this.modeToggle.addEventListener('click', () => {
            this.mode = this.mode === PLAYBACK_MODES.SCRAMBLE
                ? PLAYBACK_MODES.SOLVE
                : PLAYBACK_MODES.SCRAMBLE;
            this.updateModeToggle();
            this.#cancelPending();
            this.lastApplied = this.#requestKey();
            this.callbacks.onModeChange(this.getRequest());
        });

        this.playButton.addEventListener('click', () => {
            this.callbacks.onPlayToggle();
        });

        // 暫定：最初 / 最後へジャンプ
        this.prevButton.addEventListener('click', () => {
            this.callbacks.onSeek(0);
        });

        this.nextButton.addEventListener('click', () => {
            this.callbacks.onSeek(1);
        });

        this.presetToggle.addEventListener('click', () => {
            const isOpen = this.presetToggle.getAttribute('aria-expanded') === 'true';
            this.presetToggle.setAttribute('aria-expanded', String(!isOpen));
            this.presetBody.classList.toggle('open', !isOpen);
            this.#autosize(this.presetInput);
        });

        this.seekBarInput.addEventListener('input', event => {
            const progress = Number(event.target.value) / Number(event.target.max);
            this.#paintSeek(progress);
            this.callbacks.onSeek(progress);
        });

        this.seekBarInput.addEventListener('pointerdown', () => {
            this.callbacks.onSeekDragStart();
        });

        window.addEventListener('pointerup', () => {
            this.callbacks.onSeekDragEnd();
        });
    }

    setKeyboardVisible(show) {
        this.keyboardButton.setAttribute('aria-pressed', String(show));
        this.actionRow.hidden = show;
        this.keyboardPanel.hidden = !show;
        this.inputPage.classList.toggle('kb-open', show);
        this.rotationKeyboard.setNativeKeyboardEnabled(!show);
        if (show) {
            document.activeElement?.blur?.();
        }
        this.callbacks.onKeyboardToggle?.(show);
    }

    #requestKey() {
        const { presetText, movesText, mode } = this.getRequest();
        return JSON.stringify([presetText, movesText, mode]);
    }

    #showVeil(show) {
        this.stageVeil.hidden = !show;
    }

    #scheduleApply() {
        clearTimeout(this.applyTimer);
        this.#showVeil(true);
        this.applyTimer = setTimeout(() => this.#applyNow(), AUTO_APPLY_MS);
    }

    #cancelPending() {
        clearTimeout(this.applyTimer);
        this.applyTimer = null;
        this.#showVeil(false);
    }

    #applyNow() {
        this.#cancelPending();
        const key = this.#requestKey();
        if (key === this.lastApplied) {
            return;                               // 入力が元に戻っただけなら再読み込みしない
        }
        this.lastApplied = key;
        this.callbacks.onAnalyze(this.getRequest());
    }

    /** 起動直後の読み込みを済ませたことを記録（App から呼ぶ） */
    markApplied() {
        this.lastApplied = this.#requestKey();
    }

    getRequest() {
        return {
            presetText: this.presetInput.value,
            movesText: this.movesInput.value,
            mode: this.mode
        };
    }

    updateModeToggle() {
        this.modeToggle.dataset.mode = this.mode;
        this.modeToggle.setAttribute('aria-label', MODE_LABELS[this.mode]);
        this.modeToggle.setAttribute('aria-pressed', this.mode === PLAYBACK_MODES.SOLVE ? 'true' : 'false');
    }

    updateSeek(position) {
        const max = Number(this.seekBarInput.max);
        this.seekBarInput.value = Math.round(position * max);
        this.#paintSeek(position);
    }

    #autosize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight + textarea.offsetHeight - textarea.clientHeight}px`;
    }

    #paintSeek(position) {
        this.seekBarInput.style.setProperty('--p', `${position * 100}%`);
    }

    updatePlayButton(isPlaying) {
        this.playButton.dataset.state = isPlaying ? 'playing' : 'paused';
        this.playButton.setAttribute('aria-label', isPlaying ? '停止' : '再生');
    }

    // エラー表示専用（正常時は非表示）
    setStatus(message = '') {
        this.statusMessage.textContent = message;
        this.statusMessage.hidden = !message;
    }
}
