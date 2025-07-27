/* global AFRAME, THREE */

AFRAME.registerComponent('texture-blender', {
  schema: {
    scanTexture: { type: 'map' },
    paintingTexture: { type: 'map' },
    noiseMap: { type: 'map' },
    normalMap: { type: 'map' },
    roughnessMap: { type: 'map' },
    roughnessFactor: { type: 'number', default: 0.54 },
    threshold: { type: 'number', default: 0.58 },
    blendSoftness: { type: 'number', default: 0.37 },
    noiseScrollSpeedX: { type: 'number', default: 0.05 },
    noiseScrollSpeedY: { type: 'number', default: -0.06 }
  },

  init: function () {
    const model = this.el.getObject3D('mesh');
    if (model) {
      this.applyShader(model);
    } else {
      this.el.addEventListener('model-loaded', (e) => {
        this.applyShader(e.detail.model);
      });
    }
  },
  
  tick: function (time) {
    if (!this.shader) return;
    const timeInSeconds = time / 1000;
    this.shader.uniforms.uNoiseOffset.value.x = timeInSeconds * this.data.noiseScrollSpeedX;
    this.shader.uniforms.uNoiseOffset.value.y = timeInSeconds * this.data.noiseScrollSpeedY;
  },

  update: function () {
    if (this.shader) {
        this.shader.uniforms.uThreshold.value = this.data.threshold;
        this.shader.uniforms.uBlendSoftness.value = this.data.blendSoftness;
    }
    if (this.material) {
        this.material.roughness = this.data.roughnessFactor;
    }
  },

  applyShader: function (model) {
    const data = this.data;
    
    // Create textures from the image assets
    const scanTexture = new THREE.Texture(data.scanTexture);
    const paintingTexture = new THREE.Texture(data.paintingTexture);
    const noiseMap = new THREE.Texture(data.noiseMap);
    const normalMap = new THREE.Texture(data.normalMap);
    const roughnessMap = new THREE.Texture(data.roughnessMap);

    // Set texture properties
    [scanTexture, paintingTexture, noiseMap, normalMap, roughnessMap].forEach(t => {
        t.needsUpdate = true;
        t.flipY = false;
    });
    noiseMap.wrapS = THREE.RepeatWrapping;
    noiseMap.wrapT = THREE.RepeatWrapping;

    // Start with a standard material, using the SCAN texture as the base map.
    // This ensures it's mapped with the primary UV set (`uv`).
    const material = new THREE.MeshStandardMaterial({ 
        map: scanTexture,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        roughness: data.roughnessFactor
    });

    // Use onBeforeCompile to inject our custom code into the standard shader.
    material.onBeforeCompile = (shader) => {
      // 1. Pass our other textures and uniforms to the shader
      shader.uniforms.uPaintingTexture = { value: paintingTexture };
      shader.uniforms.uNoiseMap = { value: noiseMap };
      shader.uniforms.uThreshold = { value: data.threshold };
      shader.uniforms.uBlendSoftness = { value: data.blendSoftness };
      shader.uniforms.uNoiseOffset = { value: new THREE.Vector2(0, 0) };

      // 2. Manually declare our varyings to prevent them from being optimized away.
      shader.vertexShader = 'varying vec2 vUv;\nvarying vec2 vUv2;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        // Pass both UV sets to the fragment shader
        '#include <uv_vertex>\nvUv = uv;\nvUv2 = uv1;'
      );
      
      shader.fragmentShader = 'varying vec2 vUv;\nvarying vec2 vUv2;\n' + 
                              'uniform sampler2D uPaintingTexture;\n' + 
                              'uniform sampler2D uNoiseMap;\n' +
                              'uniform float uThreshold;\n' +
                              'uniform float uBlendSoftness;\n' +
                              'uniform vec2 uNoiseOffset;\n' + 
                              shader.fragmentShader;

      // 3. Inject the logic to INVERT the roughness map
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `
        float roughnessFactor = roughness;
        #ifdef USE_ROUGHNESSMAP
            vec4 texelRoughness = texture2D( roughnessMap, vUv );
            // By default, Three.js uses the green channel (.g).
            // We are inverting the value here.
            float invertedRoughness = texelRoughness.g;
            roughnessFactor += invertedRoughness;
        #endif
        `
      );

      // 4. Inject the blending logic
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment> 

        // --- Our Custom Blending Logic ---
        // 'diffuseColor' currently holds the color from the base map (our scanTexture).
        vec4 paintingColor = texture2D(uPaintingTexture, vUv2); // Sample painting with the second UV map.
        
        // Use vUv2 for the noise map as well to resolve the 'vUv undeclared' error.
        float noiseValue = texture2D(uNoiseMap, vUv2 + uNoiseOffset).r;
        float blendFactor = smoothstep(uThreshold - uBlendSoftness, uThreshold + uBlendSoftness, noiseValue);
        
        // When blendFactor is 0 (low noise), show the painting.
        // When blendFactor is 1 (high noise), show the scan (the original diffuseColor).
        diffuseColor = mix(paintingColor, diffuseColor, blendFactor);
        `
      );
      
      // Save the shader and material so we can update them later
      this.shader = shader;
      this.material = material;
    };

    model.traverse((node) => {
      if (node.isMesh) {
        node.material = material;
      }
    });
  }
}); 