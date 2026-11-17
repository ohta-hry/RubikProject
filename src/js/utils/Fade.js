/**
 * 要素をフェードアウト → コールバック（暗転中に状態を切り替える）→ フェードイン する。
 * @param {HTMLElement} element
 * @param {number} durationMs  フェードアウト／フェードインそれぞれの長さ
 * @param {() => void} onHidden  完全に消えた瞬間に呼ばれる
 */
export async function fadeOutIn(element, durationMs, onHidden) {
    const out = element.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: durationMs, easing: 'ease-in-out', fill: 'forwards' }
    );
    await out.finished;

    onHidden();
    out.cancel();

    const back = element.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: durationMs, easing: 'ease-in-out' }
    );
    await back.finished;
}
