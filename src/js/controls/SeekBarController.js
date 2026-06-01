const MS_PER_SECOND = 1000;
const MIN_PROGRESS = 0;
const MAX_PROGRESS = 1;

export class SeekBarController {
    #progress;

    constructor(totalDuration) {
        if (!Number.isFinite(totalDuration) || totalDuration <= 0) {
            throw new Error('totalDuration must be a positive number');
        }

        this.#progress = MIN_PROGRESS;
        this.isPlaying = false;
        this.isDragging = false;
        this.totalDuration = totalDuration * MS_PER_SECOND;
        this.startTime = Date.now();
    }

    update() {
        if (!this.isPlaying || this.isDragging) {
            return this.#progress;
        }

        const elapsed = Date.now() - this.startTime;
        this.progress = elapsed / this.totalDuration;

        if (this.#progress >= MAX_PROGRESS) {
            this.isPlaying = false;
        }

        return this.#progress;
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;

        if (this.isPlaying) {
            if (this.#progress >= MAX_PROGRESS) {
                this.#progress = MIN_PROGRESS;
            }

            this.startTime = Date.now() - this.#progress * this.totalDuration;
        }
    }

    setDragging(isDragging) {
        this.isDragging = isDragging;

        if (isDragging) {
            this.isPlaying = false;
        }
    }

    set progress(value) {
        if (!Number.isFinite(value)) {
            return;
        }

        this.#progress = Math.min(Math.max(value, MIN_PROGRESS), MAX_PROGRESS);

        if (this.isPlaying) {
            this.startTime = Date.now() - this.#progress * this.totalDuration;
        }
    }

    get progress() {
        return this.#progress;
    }
}
