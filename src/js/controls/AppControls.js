export const PLAYBACK_MODES = {
    SCRAMBLE: 'scramble',
    SOLVE: 'solve'
};

const MODE_LABELS = {
    [PLAYBACK_MODES.SCRAMBLE]: 'スクランブル',
    [PLAYBACK_MODES.SOLVE]: 'ソルブ'
};

export class AppControls {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.mode = PLAYBACK_MODES.SCRAMBLE;

        this.presetInput = document.getElementById('preset-input');
        this.modeToggle = document.getElementById('mode-toggle');
        this.movesInput = document.getElementById('moves-input');
        this.analyzeButton = document.getElementById('analyze-button');
        this.playButton = document.getElementById('play-button');
        this.prevButton = document.getElementById('prev-button');
        this.nextButton = document.getElementById('next-button');
        this.seekBarInput = document.getElementById('seek-bar');
        this.presetToggle = document.getElementById('preset-toggle');
        this.presetBody = document.getElementById('preset-body');
        this.keyboardButton = document.getElementById('keyboard-button');
        this.statusMessage = document.getElementById('status-message');

        this.#bindEvents();
        this.updateModeToggle();
    }

    #bindEvents() {
        this.analyzeButton.addEventListener('click', () => {
            this.callbacks.onAnalyze(this.getRequest());
        });

        // 改行できる入力欄：内容に合わせて高さを自動調整。Ctrl/Cmd+Enterで適用
        [this.presetInput, this.movesInput].forEach(input => {
            input.addEventListener('input', () => this.#autosize(input));
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    this.callbacks.onAnalyze(this.getRequest());
                }
            });
            this.#autosize(input);
        });

        // 将来のボタン式キーボード表示用（現在は表示状態の切り替えのみ）
        this.keyboardButton.addEventListener('click', () => {
            const show = this.keyboardButton.getAttribute('aria-pressed') !== 'true';
            this.keyboardButton.setAttribute('aria-pressed', String(show));
            this.callbacks.onKeyboardToggle?.(show);
        });

        this.modeToggle.addEventListener('click', () => {
            this.mode = this.mode === PLAYBACK_MODES.SCRAMBLE
                ? PLAYBACK_MODES.SOLVE
                : PLAYBACK_MODES.SCRAMBLE;
            this.updateModeToggle();
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
