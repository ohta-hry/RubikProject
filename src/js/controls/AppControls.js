export const PLAYBACK_MODES = {
    SCRAMBLE: 'scramble',
    SOLVE: 'solve'
};

const MODE_LABELS = {
    [PLAYBACK_MODES.SCRAMBLE]: 'スクランブル',
    [PLAYBACK_MODES.SOLVE]: 'ソルブ　　　'
};

const SEEK_PERCENT_SCALE = 100;

export class AppControls {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.mode = PLAYBACK_MODES.SCRAMBLE;

        this.presetInput = document.getElementById('preset-input');
        this.modeToggle = document.getElementById('mode-toggle');
        this.movesInput = document.getElementById('moves-input');
        this.analyzeButton = document.getElementById('analyze-button');
        this.playButton = document.getElementById('play-button');
        this.seekBarInput = document.getElementById('seek-bar');
        this.seekLabel = document.getElementById('seek-label');
        this.statusMessage = document.getElementById('status-message');

        this.#bindEvents();
        this.updateModeToggle();
    }

    #bindEvents() {
        this.analyzeButton.addEventListener('click', () => {
            this.callbacks.onAnalyze(this.getRequest());
        });

        [this.presetInput, this.movesInput].forEach(input => {
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    this.callbacks.onAnalyze(this.getRequest());
                }
            });
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

        this.seekBarInput.addEventListener('input', event => {
            const progress = Number(event.target.value) / Number(event.target.max);
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
        this.modeToggle.textContent = `モード: ${MODE_LABELS[this.mode]}`;
        this.modeToggle.setAttribute('aria-pressed', this.mode === PLAYBACK_MODES.SOLVE ? 'true' : 'false');
    }

    updateSeek(position) {
        const max = Number(this.seekBarInput.max);
        this.seekBarInput.value = Math.round(position * max);
        this.seekLabel.textContent = `${Math.round(position * SEEK_PERCENT_SCALE)}%`;
    }

    updatePlayButton(isPlaying) {
        this.playButton.textContent = isPlaying ? '停止' : '再生';
    }

    setStatus(message) {
        this.statusMessage.textContent = message;
    }
}
