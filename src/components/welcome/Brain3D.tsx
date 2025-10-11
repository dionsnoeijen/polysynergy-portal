'use client';

import { useLayoutEffect, useRef, useState } from "react";

export default function Brain3D() {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useLayoutEffect(() => {
        const mount = mountRef.current;
        if (!mount || sceneRef.current) return; // Prevent double initialization

        // Clear any existing children first
        while (mount.firstChild) {
            mount.removeChild(mount.firstChild);
        }

        let initialized = false;
        let timeoutId: any = null;

        // Use requestIdleCallback or setTimeout to defer initialization
        const initScene = async () => {
            // Triple check we haven't initialized yet and mount is still valid
            if (initialized || sceneRef.current || !mountRef.current) return;
            initialized = true;

            try {
                const { default: Scene } = await import("./Scene");

                // Final check before creating scene
                if (!mountRef.current) return;

                const scene = new Scene();
                const renderer = scene.getRenderer();
                const domElement = renderer.domElement;

                // Check mount is still valid before appending
                if (mountRef.current) {
                    domElement.style.position = 'absolute';
                    domElement.style.top = '0';
                    domElement.style.left = '0';
                    domElement.style.zIndex = '0';
                    domElement.style.opacity = '0';
                    domElement.style.transition = 'opacity 0.5s ease-in';
                    mountRef.current.appendChild(domElement);
                    sceneRef.current = scene;

                    // Fade in after a brief delay
                    setTimeout(() => {
                        domElement.style.opacity = '1';
                        setIsLoaded(true);
                    }, 100);
                }
            } catch (error) {
                console.error('Failed to initialize Brain3D scene:', error);
                initialized = false;
            }
        };

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            requestIdleCallback(initScene);
        } else {
            timeoutId = setTimeout(initScene, 100) as any;
        }

        return () => {
            initialized = true; // Prevent further initialization

            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            if (sceneRef.current) {
                sceneRef.current.dispose();
                sceneRef.current = null;
            }

            // Clean up DOM elements safely
            const currentMount = mountRef.current;
            if (currentMount) {
                while (currentMount.firstChild) {
                    currentMount.removeChild(currentMount.firstChild);
                }
            }
        };
    }, []);

    return (
        <div className="relative w-full h-full">
            {/* Placeholder with gradient background */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg animate-pulse" />
            )}
            <div
                ref={mountRef}
                className="w-full h-full"
            />
        </div>
    );
}