export class MouseControls {
    constructor(renderer_, cubeGroup_) {
        this.renderer = renderer_;
        this.cubeGroup = cubeGroup_;
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.init();
    }
    
    init() {
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('mousedown', (event) => {
            this.isMouseDown = true;
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        });
        
        canvas.addEventListener('mousemove', (event) => {
            if (!this.isMouseDown) return;
            
            const deltaX = event.clientX - this.mouseX;
            const deltaY = event.clientY - this.mouseY;
            
            // 回転方向を元に戻す
            this.cubeGroup.rotation.y += deltaX * 0.01;
            this.cubeGroup.rotation.x += deltaY * 0.01;
            
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        });
        
        canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.isMouseDown = false;
        });
    }
}