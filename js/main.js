/* global AFRAME, setupDebugUI */

const setupTimeOfDay = (modelEntity, isDebugMode) => {
    const morningButton = document.getElementById('morning-button');
    const dayButton = document.getElementById('day-button');
    const nightButton = document.getElementById('night-button');
    const target = document.querySelector('#target');
    const scanningOverlay = document.getElementById('scanning-overlay');

    const musicMorning = document.querySelector('#music-morning');
    const musicDay = document.querySelector('#music-day');
    const musicNight = document.querySelector('#music-night');
    let currentMusic = musicDay;

    const morningHemiLight = document.querySelector('#morning-hemi-light');
    const dayHemiLight = document.querySelector('#day-hemi-light');
    const nightHemiLight = document.querySelector('#night-hemi-light');

    const morningDirLight = document.querySelector('#morning-dir-light');
    const dayDirLight = document.querySelector('#day-dir-light');
    const nightDirLight = document.querySelector('#night-dir-light');

    const allLights = [morningHemiLight, dayHemiLight, nightHemiLight, morningDirLight, dayDirLight, nightDirLight];

    const setTimeOfDay = (mode) => {
        [musicMorning, musicDay, musicNight].forEach(m => m.pause());
        allLights.forEach(l => l.setAttribute('light', 'intensity', 0));

        if (mode === 'morning') {
            morningHemiLight.setAttribute('light', 'intensity', 1.0);
            morningDirLight.setAttribute('light', 'intensity', 0.54);
            currentMusic = musicMorning;
        } else if (mode === 'night') {
            nightHemiLight.setAttribute('light', 'intensity', 0.83);
            nightDirLight.setAttribute('light', 'intensity', 0.89);
            currentMusic = musicNight;
        } else {
            dayHemiLight.setAttribute('light', 'intensity', 0.6);
            dayDirLight.setAttribute('light', 'intensity', 0.47);
            currentMusic = musicDay;
        }
    };
    
    const initializeTimeOfDay = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setTimeOfDay('morning');
        else if (hour >= 18 || hour < 5) setTimeOfDay('night');
        else setTimeOfDay('day');
    };

    morningButton.addEventListener('click', () => setTimeOfDay('morning'));
    dayButton.addEventListener('click', () => setTimeOfDay('day'));
    nightButton.addEventListener('click', () => setTimeOfDay('night'));
    
    if (!isDebugMode) {
        target.addEventListener('targetFound', () => { 
            currentMusic.play();
            scanningOverlay.style.display = 'none';
        });
        target.addEventListener('targetLost', () => { 
            currentMusic.pause(); 
            scanningOverlay.style.display = 'flex';
        });
    }

    return { initializeTimeOfDay };
};

AFRAME.registerComponent('scene-manager', {
    init: function () {
        const sceneEl = this.el;
        const target = document.querySelector('#target');
        const modelEntity = document.querySelector('#model-entity');
        const startButton = document.getElementById('start-button');
        const loadingScreen = document.getElementById('loading-screen');
        const debugToggles = document.getElementById('debug-toggles');
        const markerPlane = document.getElementById('marker-plane');
        const scanningOverlay = document.getElementById('scanning-overlay');
        
        const urlParams = new URLSearchParams(window.location.search);
        const isDebugMode = urlParams.has('debug');

        const { initializeTimeOfDay } = setupTimeOfDay(modelEntity, isDebugMode);
        initializeTimeOfDay();

        if (isDebugMode) {
            loadingScreen.style.display = 'none';
            debugToggles.style.display = 'flex';
            target.setAttribute('visible', 'true');
            markerPlane.setAttribute('visible', 'true');
            
            const cameraEl = sceneEl.camera.el;
            cameraEl.setAttribute('look-controls', 'enabled', true);
            cameraEl.setAttribute('wasd-controls', 'enabled: true; fly: true;');
            cameraEl.setAttribute('position', '0 1.6 2');

            setupDebugUI(modelEntity);
        } else {
            sceneEl.setAttribute('mindar-image', 'imageTargetSrc: assets/marker.mind; autoStart: false; uiScanning: no;');
            target.setAttribute('mindar-image-target', 'targetIndex', 0);

            startButton.addEventListener('click', () => {
                loadingScreen.style.display = 'none';
                scanningOverlay.style.display = 'flex';
                const arSystem = sceneEl.systems["mindar-image-system"];
                arSystem.start();
            });
        }
    }
}); 