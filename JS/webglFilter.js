import {Mesh, Program, Renderer, Triangle} from './ogl-master/src/index.js';

const loadStartTime = performance.now();

class WebGLFilter {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('WebGLFilter: Container element not found');
            return;
        }

        // Detect device capability
        this.deviceCapability = this.detectDeviceCapability();
        this.isVisible = true;
        this.lastFrameTime = 0;
        this.targetFPS = this.deviceCapability.targetFPS;
        this.frameInterval = 1000 / this.targetFPS;

        // Setup renderer
        this.renderer = new Renderer({
            dpr: this.deviceCapability.dpr,
            alpha: true,
            antialias: false,
            stencil: false,
            depth: false
        });

        this.gl = this.renderer.gl;
        this.container.appendChild(this.gl.canvas);
        this.gl.clearColor(0, 0, 0, 0);

        // WebGL optimizations
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.STENCIL_TEST);

        // Shaders
        this.setupShaders();

        const geometry = new Triangle(this.gl);
        this.mesh = new Mesh(this.gl, {
            geometry,
            program: this.program
        });

        this.timeOffset = Math.random() * 100;
        this.resize();

        window.addEventListener('resize', () => this.resize());

        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
        });

        requestAnimationFrame((t) => this.render(t));
    }

    detectDeviceCapability() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 3;
        const pixelRatio = window.devicePixelRatio || 1;

        if (isMobile || isLowEnd) {
            return {
                dpr: 1,
                targetFPS: 30,
                qualityLevel: 'medium'
            };
        } else {
            return {
                dpr: Math.min(pixelRatio, 2),
                targetFPS: 60,
                qualityLevel: 'high'
            };
        }
    }

    setupShaders() {
        const vertexShader = `
            attribute vec2 position;
            attribute vec2 uv; 
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fragmentShader = `
            precision mediump float;
            varying vec2 vUv;

            uniform float iTime;
            uniform vec3 iResolution;
            uniform float uScale;
            uniform vec2 uGridMul;
            uniform float uDigitSize;
            uniform float uScanlineIntensity;
            uniform float uGlitchAmount;
            uniform float uFlickerAmount;
            uniform float uNoiseAmp;
            uniform float uChromaticAberration;
            uniform float uCurvature;
            uniform float uPageLoadProgress;
            uniform float uUsePageLoadAnimation;
            uniform float uBrightness;

            float time;

            float hash21(vec2 p){
                p = fract(p * 234.56);
                p += dot(p, p + 34.56);
                return fract(p.x * p.y);
            }

            float noise(vec2 p) {
                return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2;
            }

            mat2 rotate(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat2(c, -s, s, c);
            }

            float fbm(vec2 p) {
                p *= 1.1;
                float f = 0.0;
                float amp = 0.5 * uNoiseAmp;
                
                mat2 modify0 = rotate(time * 0.02);
                f += amp * noise(p);
                p = modify0 * p * 2.0;
                amp *= 0.454545;
                
                mat2 modify1 = rotate(time * 0.02);
                f += amp * noise(p);
                p = modify1 * p * 2.0;
                amp *= 0.454545;
                
                mat2 modify2 = rotate(time * 0.08);
                f += amp * noise(p);
                
                return f;
            }

            float pattern(vec2 p, out vec2 q, out vec2 r) {
                vec2 offset1 = vec2(1.0);
                vec2 offset0 = vec2(0.0);
                mat2 rot01 = rotate(0.1 * time);
                mat2 rot1 = rotate(0.1);
                
                q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
                r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
                return fbm(p + r);
            }

            float digit(vec2 p) {
                vec2 grid = uGridMul * 15.0;
                vec2 s = floor(p * grid) / grid;
                p = p * grid;
                vec2 q, r;
                float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;
                
                if(uUsePageLoadAnimation > 0.5) {
                    float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
                    float cellDelay = cellRandom * 0.8;
                    float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);
                    
                    float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
                    intensity *= fadeAlpha;
                }
                
                p = fract(p);
                p *= uDigitSize;
                
                float px5 = p.x * 5.0;
                float py5 = (1.0 - p.y) * 5.0;
                float x = fract(px5);
                float y = fract(py5);
                
                float i = floor(py5) - 2.0;
                float j = floor(px5) - 2.0;
                float n = i * i + j * j;
                float f = n * 0.0625;
                
                float isOn = step(0.1, intensity - f);
                float brightness = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);
                
                return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * brightness;
            }

            float onOff(float a, float b, float c) {
                return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
            }

            float displace(vec2 look) {
                float y = look.y - mod(iTime * 0.25, 1.0);
                float window = 1.0 / (1.0 + 50.0 * y * y);
                return sin(look.y * 20.0 + iTime) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * window;
            }

            vec3 getColor(vec2 p) {
                vec3 colorPink = vec3(0.95098, 0.65490, 0.67843);
                vec3 colorBlue = vec3(0.3, 0.5, 0.9); 
                vec3 colorOrange = vec3(0.9, 0.6, 0.2);
                
                // Scanlines
                float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
                bar *= uScanlineIntensity;
                
                // Glitch
                float displacement = displace(p);
                p.x += displacement;
                
                vec3 glitchColor = vec3(0.0);
                if (uGlitchAmount > 0.1) {
                    float extra = displacement * uGlitchAmount;
                    p.x += extra;
                    glitchColor = colorOrange * abs(extra) * 50.0;
                }
                
                // Main Digit
                float middle = digit(p);
                
                const float off = 0.002;
                float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
                            digit(p + vec2(-off, 0.0)) + digit(p + vec2(0.0, 0.0)) + digit(p + vec2(off, 0.0)) +
                            digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));
                
                vec3 baseColor = (colorBlue * middle) + (colorPink * sum * 0.1) + glitchColor;
                baseColor *= bar;
                return baseColor;
            }

            vec2 barrel(vec2 uv) {
                vec2 c = uv * 2.0 - 1.0;
                float r2 = dot(c, c);
                c *= 1.0 + uCurvature * r2;
                return c * 0.5 + 0.5;
            }

            void main() {
                time = iTime * 0.333333;
                vec2 uv = vUv;

                if(uCurvature > 0.001) {
                    uv = barrel(uv);
                }
                
                vec2 p = uv * uScale;
                vec3 col = getColor(p);

                if(uChromaticAberration > 0.001) {
                    vec2 ca = vec2(uChromaticAberration) / iResolution.xy;
                    col.r = getColor(p + ca).r;
                    col.b = getColor(p - ca).b;
                }
                
                col *= uBrightness;

                gl_FragColor = vec4(col, 0.8);
            }
        `;

        this.program = new Program(this.gl, {
            vertex: vertexShader,
            fragment: fragmentShader,
            uniforms: {
                iTime: { value: 0 },
                iResolution: {
                    value: [
                        this.gl.canvas.width,
                        this.gl.canvas.height,
                        this.gl.canvas.width / this.gl.canvas.height
                    ]
                },
                uScale: { value: 2.5 },
                uGridMul: { value: [2, 1] },
                uDigitSize: { value: 1.2 },
                uScanlineIntensity: { value: 1.0 },
                uGlitchAmount: { value: 1.0 },
                uFlickerAmount: { value: 1.0 },
                uNoiseAmp: { value: 1.0 },
                uChromaticAberration: { value: 0.005 },
                uCurvature: { value: 0.1 },
                uBrightness: { value: 0.5 },
                uUsePageLoadAnimation: { value: 1.0 },
                uPageLoadProgress: { value: 0.0 }
            },
            transparent: true
        });
    }

    resize() {
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);

        const res = this.program.uniforms.iResolution.value;
        res[0] = this.gl.canvas.width;
        res[1] = this.gl.canvas.height;
        res[2] = this.gl.canvas.width / this.gl.canvas.height;
    }

    render(time) {
        const elapsed = time - this.lastFrameTime;

        if (elapsed < this.frameInterval) {
            requestAnimationFrame((t) => this.render(t));
            return;
        }

        this.lastFrameTime = time - (elapsed % this.frameInterval);

        if (!this.isVisible) {
            requestAnimationFrame((t) => this.render(t));
            return;
        }

        this.program.uniforms.iTime.value = (time * 0.001 + this.timeOffset) * 0.3;

        const animationDuration = 2000;
        const animationElapsed = time - loadStartTime;
        const progress = Math.min(animationElapsed / animationDuration, 1.0);
        this.program.uniforms.uPageLoadProgress.value = progress;

        if (progress >= 1.0 && this.program.uniforms.uUsePageLoadAnimation.value === 1.0) {
            this.program.uniforms.uUsePageLoadAnimation.value = 0.0;
        }

        this.renderer.render({ scene: this.mesh });
        requestAnimationFrame((t) => this.render(t));
    }

    destroy() {
        window.removeEventListener('resize', () => this.resize());

        if (this.gl) {
            const loseContext = this.gl.getExtension('WEBGL_lose_context');
            if (loseContext) loseContext.loseContext();
        }

        if (this.gl.canvas && this.gl.canvas.parentElement) {
            this.gl.canvas.parentElement.removeChild(this.gl.canvas);
        }
    }
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    const shouldLoad = window.innerWidth > 768 &&
        (!navigator.hardwareConcurrency || navigator.hardwareConcurrency >= 3);

    if (shouldLoad) {
        window.webglFilter = new WebGLFilter('webgl-filter-container');
    }
});