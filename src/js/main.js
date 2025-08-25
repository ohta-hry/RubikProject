import { App } from './core/App.js';

window.addEventListener('load', () => {
    const app = new App();
    
    // グローバル関数として公開
    window.rotateCube = () => {
        app.isRotating = !app.isRotating;
        const button = event.target;
        button.textContent = app.isRotating ? '回転停止' : '立方体を回転';
    };
    
    window.resetCube = () => {
        app.cubeManager.cubeGroup.rotation.set(0, 0, 0);
        app.isRotating = false;
        document.querySelector('button').textContent = '立方体を回転';
    };
});