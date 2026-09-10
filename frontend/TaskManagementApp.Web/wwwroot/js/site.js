document.addEventListener('DOMContentLoaded', () => {
    const cloudCursor = document.getElementById('cloud-cursor');
    if (!cloudCursor) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    
    // Smooth trailing effect position
    let cloudX = mouseX;
    let cloudY = mouseY;
    
    // Set how much the cloud lags behind the cursor (0.0 to 1.0)
    // Lower = slower, smoother
    const easing = 0.1;

    // Show cursor glow on first mouse movement
    document.addEventListener('mousemove', (e) => {
        cloudCursor.style.opacity = '0.6';
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Animation loop
    function animate() {
        // Calculate distance between cloud and mouse
        const dx = mouseX - cloudX;
        const dy = mouseY - cloudY;
        
        // Move cloud slightly towards mouse
        cloudX += dx * easing;
        cloudY += dy * easing;
        
        // Update position using CSS transform
        cloudCursor.style.transform = `translate(${cloudX}px, ${cloudY}px) translate(-50%, -50%)`;
        
        requestAnimationFrame(animate);
    }
    
    animate();
});
