import * as THREE from "three";
import { EffectComposer, EffectPass, FXAAEffect, RenderPass } from "postprocessing";

export default class Scene {
    private scene: THREE.Scene;
    private width: number;
    private height: number;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private composer: EffectComposer;
    private bubbles: THREE.Mesh[] = [];
    private isAnimating: boolean = true;
    private animationId: number | null = null;
    private resizeListener: (() => void) | null = null;

    constructor() {
        this.scene = new THREE.Scene();
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 1000);
        this.camera.position.z = 4;

        // Adjust camera position for mobile
        if (this.width < 768) {
            this.camera.position.x = 0;
            this.camera.position.y = 0.5; // Shift up slightly on mobile
        }

        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            powerPreference: "high-performance",
            antialias: true,
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(new EffectPass(this.camera, new FXAAEffect()));

        this.createBubble(0, 0, 0);
        this.animate();
        this.handleResize();
    }

    private handleResize(): void {
        this.resizeListener = () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.camera.aspect = this.width / this.height;

            // Adjust camera position based on viewport width
            if (this.width < 768) {
                this.camera.position.x = 0;
                this.camera.position.y = 0.5; // Shift up slightly on mobile
            } else {
                this.camera.position.x = 0;
                this.camera.position.y = 0;
            }

            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.width, this.height);
            this.composer.setSize(this.width, this.height);
        };
        window.addEventListener('resize', this.resizeListener);
    }

    private createGeometry(): THREE.IcosahedronGeometry {
        return new THREE.IcosahedronGeometry(1, 40);
    }

    private createBubbleMaterial(): THREE.ShaderMaterial {
        return new THREE.ShaderMaterial({
            uniforms: {
                iTime: { value: 0.0 },
                scale: { value: 4.0 },
                displacementAmount: { value: 0.12 },
                waveFrequency: { value: 10.0 },
                waveAmplitude: { value: 0.03 },
                waveSpeed: { value: 1.5 },
                lightPosition: { value: new THREE.Vector3(-5, 5, 10) },
                ambientLight: { value: new THREE.Color(0xac3eac) },
                opacity: { value: 1.0 },
            },
            vertexShader: `
uniform float iTime;
uniform float scale;
uniform float displacementAmount;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform float waveSpeed;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplacement;

vec2 hash( vec2 p ) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return normalize(-1.0 + 2.0 * fract(sin(p) * 43758.5453123));
}

vec3 snoise( in vec2 p ) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;

    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash(i + vec2(0.0))),
    dot(b, hash(i + o)),
    dot(c, hash(i + 1.0)));
    return 1e2 * n;
}

void main() {
    vec2 p = position.xy * (scale) + vec2(-iTime * 0.1, 0.0);
    vec3 n = snoise(p);
    vec3 an = abs(n);
    vec4 s = vec4(
    dot(n, vec3(1.0)),
    dot(an, vec3(1.0)),
    length(n),
    max(max(an.x, an.y), an.z)
    );

    float displacement = 0.75 * s.y;
    vDisplacement = displacement;

    vec3 newPosition = position + normal * displacementAmount * vDisplacement;

    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`,
            fragmentShader: `
uniform vec3 lightPosition;
uniform vec3 ambientLight;
uniform float iTime;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplacement;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(lightPosition - vPosition);
    float diffuse = max(dot(normal, lightDir), 0.0);
    float hue = mod(iTime * 0.1 + length(vPosition - lightPosition), 1.0);

    // Rainbow colors that fade to white instead of black
    vec3 rainbowColor = hsv2rgb(vec3(hue, 0.8, 1.0));

    // Blend with purple/lavender based on displacement and lighting
    float blendFactor = (1.0 - diffuse) * 0.7 + (1.0 - vDisplacement) * 0.3;
    vec3 purpleColor = vec3(0.8, 0.6, 1.0); // Light purple/lavender
    vec3 finalColor = mix(rainbowColor, purpleColor, blendFactor);

    gl_FragColor = vec4(finalColor, 1.0);
}
`,
            transparent: true,
            wireframe: true,
        });
    }

    private createBubble(x: number, y: number, z: number): void {
        const geometry = this.createGeometry();
        const material = this.createBubbleMaterial();
        const bubble = new THREE.Mesh(geometry, material);

        bubble.position.set(x, y, z);
        bubble.frustumCulled = false;

        this.bubbles.push(bubble);
        this.scene.add(bubble);
    }

    private updateBubbles(): void {
        this.bubbles.forEach((bubble) => {
            (bubble.material as THREE.ShaderMaterial).uniforms.iTime.value += 0.002;
        });
    }

    private animate(): void {
        const loop = () => {
            if (this.isAnimating) {
                this.updateBubbles();
                this.composer.render();
                this.animationId = requestAnimationFrame(loop);
            }
        };
        this.animationId = requestAnimationFrame(loop);
    }

    public dispose(): void {
        this.isAnimating = false;

        // Cancel animation frame
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Remove resize listener
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }

        // Dispose Three.js resources
        this.renderer.dispose();
        this.bubbles.forEach((bubble) => {
            bubble.geometry.dispose();
            (bubble.material as THREE.Material).dispose();
        });
        this.bubbles = [];
        this.scene.clear();
    }

    public getRenderer(): THREE.WebGLRenderer {
        return this.renderer;
    }
}