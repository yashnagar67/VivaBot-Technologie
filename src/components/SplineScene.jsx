import { Suspense, lazy, useState, useCallback, useEffect, useRef } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

export default function SplineScene({ scene, className, onLoad }) {
    const [loaded, setLoaded] = useState(false);
    const wrapperRef = useRef(null);

    // Block Spline zoom but allow page scrolling
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;

        const handleWheel = (e) => {
            // Stop the event from reaching the Spline canvas (prevents zoom)
            e.stopPropagation();

            // Manually scroll the page instead
            window.scrollBy({
                top: e.deltaY,
                left: e.deltaX,
                behavior: 'auto',
            });
        };

        // Use capture phase to intercept before Spline gets it
        el.addEventListener('wheel', handleWheel, { passive: true, capture: true });
        return () => el.removeEventListener('wheel', handleWheel, { passive: true, capture: true });
    }, []);

    const handleLoad = useCallback((splineApp) => {
        // Force background to black
        try {
            if (splineApp._renderer) {
                splineApp._renderer.setClearColor(0x030305, 1);
            }
            if (splineApp._scene && splineApp._scene.background) {
                splineApp._scene.background.set(0x030305);
            }
        } catch (e) {
            // silent
        }

        // Force DOM backgrounds
        try {
            const container = document.getElementById('hero-3d-container');
            if (container) {
                const canvas = container.querySelector('canvas');
                if (canvas) canvas.style.background = '#030305';
                container.querySelectorAll('div').forEach((div) => {
                    div.style.background = '#030305';
                });
            }
        } catch (e) {
            // silent
        }

        setLoaded(true);
        if (onLoad) onLoad(splineApp);
    }, [onLoad]);

    return (
        <div ref={wrapperRef} className={`spline-scene ${className || ''}`}>
            {!loaded && (
                <div className="spline-scene__loader">
                    <div className="spline-scene__spinner" />
                </div>
            )}

            <Suspense fallback={null}>
                <Spline
                    scene={scene}
                    onLoad={handleLoad}
                    style={{
                        width: '100%',
                        height: '100%',
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.8s ease',
                        background: '#030305',
                    }}
                />
            </Suspense>
        </div>
    );
}
