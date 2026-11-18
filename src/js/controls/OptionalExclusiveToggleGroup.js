/**
 * Optional Exclusive Toggle Group（任意・排他トグルグループ）
 *
 * ・排他 : 同時にオンにできるのは最大1つ（別の選択肢を押すと切り替わる）
 * ・任意 : オンのものをもう一度押すと全部オフに戻れる（何も選ばない状態を許す）
 *
 * 選択状態の管理と見た目（aria-pressed）の反映だけを担当する。選択の意味は知らない。
 * ボタンの文字や並びは HTML 側に書く。
 *   <div class="toggle-group" role="group" aria-label="...">
 *     <button class="toggle-btn" type="button" data-option="id" aria-pressed="false">caption</button>
 *     ...
 *   </div>
 */
export class OptionalExclusiveToggleGroup {
    #buttons = new Map();   // option id → button
    #value = null;          // 選択中の option id（未選択は null）
    #onChange;

    /**
     * @param {HTMLElement} root  .toggle-group 要素
     * @param {(value: string|null) => void} [onChange]  選択が変わったときに呼ばれる
     */
    constructor(root, onChange = () => {}) {
        this.#onChange = onChange;

        root.querySelectorAll('.toggle-btn').forEach(button => {
            button.setAttribute('aria-pressed', 'false');
            this.#buttons.set(button.dataset.option, button);
        });

        root.addEventListener('click', event => {
            const button = event.target.closest('.toggle-btn');
            if (button) {
                const id = button.dataset.option;
                this.select(this.#value === id ? null : id);   // 押し直しで解除
            }
        });
    }

    /** 選択中の option id。未選択は null */
    get value() {
        return this.#value;
    }

    /** 選択を切り替える。null で全解除。変化があったときだけ onChange を呼ぶ */
    select(id) {
        if (id !== null && !this.#buttons.has(id)) {
            throw new Error(`不明な選択肢: ${id}`);
        }
        if (id === this.#value) {
            return;
        }
        this.#value = id;
        this.#buttons.forEach((button, optionId) => {
            button.setAttribute('aria-pressed', String(optionId === id));
        });
        this.#onChange(this.#value);
    }

    clear() {
        this.select(null);
    }
}
