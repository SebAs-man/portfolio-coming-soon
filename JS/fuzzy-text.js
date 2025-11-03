class FuzzyText {
    constructor(canvas, text, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.text = text;

        // Options
        this.fontSizeRem = options.fontSize || 8;
        this.fontWeight = options.fontWeight || 400;
        this.fontFamily = options.fontFamily || 'monospace';
        this.color = options.color || '#00FF41';
        this.baseIntensity = options.baseIntensity || 0.18;
        this.hoverIntensity = options.hoverIntensity || 0.5;
        this.multiline = options.multiline || false;
        this.lineHeight = options.lineHeight || 0.9;
        this.margin = options.margin || 50; //

        // Internal status
        this.isHovering = false;
        this.animationId = null;
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        this.debounceTimer = null;

        this.rootFontSize = 0;
        this.fontSizePx = 0;
        this.textBounds = {};

        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
        this.boundHandleTouchMove = this.handleTouchMove.bind(this);
        this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
        this.boundHandleResize = this.handleResize.bind(this);

        this.init();
    }

    /**
     * One-time initial setup
     */
    init() {
        this.addEventListeners();
        this.calculateMetrics();
        this.animate();
    }

    /**
     * Calculates all metrics, sizes, and draws the text on the ‘offscreen’ canvas.
     * Called in init() and on every ‘resize’.
     */
    calculateMetrics() {
        // 1. Get the root font size (the value of 1rem in pixels)
        this.rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        // 2. Calculate the font size in pixels
        this.fontSizePx = this.fontSizeRem * this.rootFontSize;
        // 3. Create the font string with ‘px’, which the canvas DOES understand
        const font = `${this.fontWeight} ${this.fontSizePx}px ${this.fontFamily}`;
        // Set up the ‘offscreen’ context for measurement
        this.offscreenCtx.font = font;
        this.offscreenCtx.textBaseline = 'top';

        let lines = this.multiline ? this.text.split('\n') : [this.text];
        let maxWidth = 0;

        lines.forEach(line => {
            const metrics = this.offscreenCtx.measureText(line);
            maxWidth = Math.max(maxWidth, Math.ceil(metrics.width));
        });

        // Use fontSizePx to calculate line height in pixels
        const lineHeightPx = this.fontSizePx * this.lineHeight;
        // Add a little padding so that the ‘fuzz’ isn't cut off
        const padding = 20;
        const textWidth = maxWidth + padding * 2;
        const textHeight = Math.ceil(lineHeightPx * lines.length) + padding * 2;
        // Resize the ‘offscreen’ canvas
        this.offscreenCanvas.width = textWidth;
        this.offscreenCanvas.height = textHeight;
        // Reapply styles to the context (resizing the canvas resets them)
        this.offscreenCtx.font = font;
        this.offscreenCtx.textBaseline = 'top';
        this.offscreenCtx.fillStyle = this.color;
        this.offscreenCtx.textAlign = 'center';
        // Draw each line on the ‘offscreen’ canvas
        lines.forEach((line, index) => {
            const y = padding + (index * lineHeightPx);
            this.offscreenCtx.fillText(line, textWidth / 2, y);
        });
        // Now, size the main canvas (the visible one)
        this.canvas.width = this.offscreenCanvas.width + this.margin * 2;
        this.canvas.height = this.offscreenCanvas.height + this.margin;
        // Reset the transformation before applying the new one
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // <-- Resetea el contexto
        this.ctx.translate(this.margin, this.margin / 2);
        // Update the text area boundaries for the 'hover'
        this.textBounds = {
            left: this.margin,
            top: this.margin / 2,
            right: this.margin + this.offscreenCanvas.width,
            bottom: this.margin / 2 + this.offscreenCanvas.height
        };
    }

    updateText(newText) {
        this.text = newText;
        this.calculateMetrics();
    }

    /**
     * Add event listeners
     */
    addEventListeners() {
        if (!this.isTouchDevice) {
            this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
            this.canvas.addEventListener('mouseleave', this.boundHandleMouseLeave);
        } else {
            this.canvas.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
            this.canvas.addEventListener('touchend', this.boundHandleTouchEnd);
        }
        // Listen for window resize to recalculate
        window.addEventListener('resize', this.boundHandleResize);
    }

    // --- Event Handlers --- //

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.isHovering = this.isInsideTextArea(x, y);
    }

    handleMouseLeave() {
        this.isHovering = false;
    }

    handleTouchMove(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        this.isHovering = this.isInsideTextArea(x, y);
    }

    handleTouchEnd() {
        this.isHovering = false;
    }

    /**
     * Resize handler with debounce to avoid excessive recalculation
     */
    handleResize() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.calculateMetrics(); // Recalculate everything
        }, 150); // Wait 150ms after the last 'resize'
    }

    isInsideTextArea(x, y) {
        return x >= this.textBounds.left &&
            x <= this.textBounds.right &&
            y >= this.textBounds.top &&
            y <= this.textBounds.bottom;
    }

    // --- Animation and Destruction --- //

    animate() {
        const fuzzRange = 30;
        const width = this.offscreenCanvas.width;
        const height = this.offscreenCanvas.height;

        // Clear the drawing area.
        // Coordinates are relative to the transformation (this.ctx.translate)
        this.ctx.clearRect(-fuzzRange, -fuzzRange, this.canvas.width + 2 * fuzzRange, this.canvas.height + 2 * fuzzRange);

        const intensity = this.isHovering ? this.hoverIntensity : this.baseIntensity;

        for (let j = 0; j < height; j++) {
            const dx = Math.floor(intensity * (Math.random() - 0.5) * fuzzRange);
            this.ctx.drawImage(
                this.offscreenCanvas,
                0, j, width, 1, // Coordinates and size of the SOURCE (slice)
                dx, j, width, 1  // Coordinates and size of the DESTINATION (where to draw the slice)
            );
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Clears everything to remove the instance
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        clearTimeout(this.debounceTimer);

        if (!this.isTouchDevice) {
            this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
            this.canvas.removeEventListener('mouseleave', this.boundHandleMouseLeave);
        } else {
            this.canvas.removeEventListener('touchmove', this.boundHandleTouchMove);
            this.canvas.removeEventListener('touchend', this.boundHandleTouchEnd);
        }

        window.removeEventListener('resize', this.boundHandleResize);
    }
}
