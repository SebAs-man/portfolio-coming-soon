// ===========================
// ANIMACIÓN DE VALORES
// ===========================
window.addEventListener('load', () => {
    const metricValues = document.querySelectorAll('.metric-value');
    metricValues.forEach((metric, index) => {
        const targetValue = parseFloat(metric.textContent);
        setTimeout(() => {
            animateValue(metric, 0, targetValue, 2000);
        }, index * 200);
    });
});

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = progress * (end - start) + start;
        element.textContent = value.toFixed(1) + '%';
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}