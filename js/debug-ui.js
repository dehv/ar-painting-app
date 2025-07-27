/* global AFRAME */

const setupToggle = (buttonId, panelId) => {
    const button = document.getElementById(buttonId);
    const panel = document.getElementById(panelId);
    if (!button || !panel) return;

    button.addEventListener('click', () => {
        const isVisible = panel.style.display === 'block';
        panel.style.display = isVisible ? 'none' : 'block';
    });
};

const setupSlider = (sliderId, valueDisplayId, propertyName, entity, componentName) => {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(valueDisplayId);
    if (!slider) return;

    const updateValue = (value) => {
        if (display) display.textContent = value;
        entity.setAttribute(componentName, propertyName, value);
    };

    updateValue(slider.value);
    slider.addEventListener('input', (event) => updateValue(event.target.value));
};

const setupTransformSlider = (sliderId, valueDisplayId, component, property, modelEntity) => {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(valueDisplayId);
    display.textContent = slider.value;
    slider.addEventListener('input', (e) => {
        const value = e.target.value;
        const current = modelEntity.getAttribute(component);
        current[property] = value;
        modelEntity.setAttribute(component, current);
        display.textContent = value;
    });
};

const setupLightControls = () => {
    const modes = ['morning', 'day', 'night'];
    const lightTypes = ['hemi', 'dir'];

    modes.forEach(mode => {
        const dirLight = document.querySelector(`#${mode}-dir-light`);

        lightTypes.forEach(type => {
            const lightEl = document.querySelector(`#${mode}-${type}-light`);
            
            const intensitySlider = document.querySelector(`#${mode}-${type}-intensity`);
            const intensityValue = document.querySelector(`#${mode}-${type}-intensity-value`);
            if(intensitySlider) {
                intensityValue.textContent = intensitySlider.value;
                intensitySlider.addEventListener('input', (e) => {
                    lightEl.setAttribute('light', 'intensity', e.target.value);
                    intensityValue.textContent = e.target.value;
                });
            }

            const colorPicker = document.querySelector(`#${mode}-${type}-color`);
            if(colorPicker) {
                colorPicker.value = lightEl.getAttribute('light').color;
                colorPicker.addEventListener('input', (e) => lightEl.setAttribute('light', 'color', e.target.value));
            }
        });

        const hemiGroundPicker = document.querySelector(`#${mode}-hemi-ground`);
        const hemiLight = document.querySelector(`#${mode}-hemi-light`);
        hemiGroundPicker.value = hemiLight.getAttribute('light').groundColor;
        hemiGroundPicker.addEventListener('input', (e) => hemiLight.setAttribute('light', 'groundColor', e.target.value));

        ['x', 'y', 'z'].forEach(axis => {
            const posSlider = document.querySelector(`#${mode}-dir-${axis}`);
            const posValue = document.querySelector(`#${mode}-dir-${axis}-value`);
            posValue.textContent = posSlider.value;
            posSlider.addEventListener('input', (e) => {
                const newPos = { ...dirLight.getAttribute('position') };
                newPos[axis] = e.target.value;
                dirLight.setAttribute('position', newPos);
                posValue.textContent = e.target.value;
            });
        });
    });

    const copyLightsButton = document.getElementById('copy-lights-button');
    copyLightsButton.addEventListener('click', () => {
        const settings = {};
        modes.forEach(mode => {
            settings[mode] = {
                hemi: {
                    intensity: document.querySelector(`#${mode}-hemi-intensity`).value,
                    color: document.querySelector(`#${mode}-hemi-color`).value,
                    groundColor: document.querySelector(`#${mode}-hemi-ground`).value,
                },
                dir: {
                    intensity: document.querySelector(`#${mode}-dir-intensity`).value,
                    color: document.querySelector(`#${mode}-dir-color`).value,
                    position: {
                        x: document.querySelector(`#${mode}-dir-x`).value,
                        y: document.querySelector(`#${mode}-dir-y`).value,
                        z: document.querySelector(`#${mode}-dir-z`).value,
                    }
                }
            };
        });
        const settingsString = JSON.stringify(settings, null, 2);
        navigator.clipboard.writeText(settingsString).then(() => alert('Light settings copied to clipboard!'));
    });
};

const setupDebugUI = (modelEntity) => {
    setupSlider('threshold-slider', 'threshold-value', 'threshold', modelEntity, 'texture-blender');
    setupSlider('softness-slider', 'softness-value', 'blendSoftness', modelEntity, 'texture-blender');
    setupSlider('scroll-x-slider', 'scroll-x-value', 'noiseScrollSpeedX', modelEntity, 'texture-blender');
    setupSlider('scroll-y-slider', 'scroll-y-value', 'noiseScrollSpeedY', modelEntity, 'texture-blender');
    
    setupTransformSlider('pos-x', 'pos-x-value', 'position', 'x', modelEntity);
    setupTransformSlider('pos-y', 'pos-y-value', 'position', 'y', modelEntity);
    setupTransformSlider('pos-z', 'pos-z-value', 'position', 'z', modelEntity);
    setupTransformSlider('rot-x', 'rot-x-value', 'rotation', 'x', modelEntity);
    setupTransformSlider('rot-y', 'rot-y-value', 'rotation', 'y', modelEntity);
    setupTransformSlider('rot-z', 'rot-z-value', 'rotation', 'z', modelEntity);
    
    const scaleSlider = document.getElementById('scale');
    const scaleValue = document.getElementById('scale-value');
    scaleValue.textContent = scaleSlider.value;
    scaleSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        modelEntity.setAttribute('scale', { x: value, y: value, z: value });
        scaleValue.textContent = value;
    });

    const copyTransformButton = document.getElementById('copy-transform-button');
    copyTransformButton.addEventListener('click', () => {
        const settings = {
            position: modelEntity.getAttribute('position'),
            rotation: modelEntity.getAttribute('rotation'),
            scale: modelEntity.getAttribute('scale')
        };
        const settingsString = JSON.stringify(settings, null, 2);
        navigator.clipboard.writeText(settingsString).then(() => alert('Transform settings copied to clipboard!'));
    });

    setupLightControls();
    
    setupToggle('toggle-time-btn', 'demo-controls');
    setupToggle('toggle-shader-btn', 'shader-controls');
    setupToggle('toggle-lights-btn', 'lighting-controls');
    setupToggle('toggle-transform-btn', 'transform-controls');
}; 