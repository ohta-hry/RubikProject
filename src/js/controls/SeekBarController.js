export class SeekBarController {
    #progress;

    constructor(totalDuration) {
        if (!Number.isFinite(totalDuration) || totalDuration <= 0) {
            throw new Error('totalDuration must be a positive number');
        }

        this.#progress = 0;
        this.isPlaying = false;
        this.isDragging = false;
        this.totalDuration = totalDuration * 1000;
        this.startTime = Date.now();
    }

    update() {
        if (!this.isPlaying || this.isDragging) {
            return this.#progress;
        }

        const elapsed = Date.now() - this.startTime;
        this.progress = elapsed / this.totalDuration;

        if (this.#progress >= 1) {
            this.isPlaying = false;
        }

        return this.#progress;
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;

        if (this.isPlaying) {
            if (this.#progress >= 1) {
                this.#progress = 0;
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

        this.#progress = Math.min(Math.max(value, 0), 1);

        if (this.isPlaying) {
            this.startTime = Date.now() - this.#progress * this.totalDuration;
        }
    }

    get progress() {
        return this.#progress;
    }
}
