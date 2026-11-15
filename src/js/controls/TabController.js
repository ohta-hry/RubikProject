export class TabController {
    constructor(tabList) {
        this.tabs = Array.from(tabList.querySelectorAll('.dock-tab'));
        this.pages = new Map(
            this.tabs.map(tab => [tab, document.getElementById(`page-${tab.dataset.page}`)])
        );

        tabList.addEventListener('click', event => {
            const tab = event.target.closest('.dock-tab');
            if (tab) {
                this.select(tab);
            }
        });
    }

    select(selectedTab) {
        this.tabs.forEach(tab => {
            const isActive = tab === selectedTab;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
            this.pages.get(tab).classList.toggle('active', isActive);
        });
    }
}
