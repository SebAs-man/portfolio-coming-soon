class FuzzyText {
    constructor(canvasOrId, text, options = {}) {
        this.canvas = (typeof canvasOrId === 'string') ? document.getElementById(canvasOrId) : canvasOrId;
        if (!this.canvas) {
            console.error('FuzzyText: Canvas not found.');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) return;

        this.text = text;
        this.fontSize = options.fontSize ? `${options.fontSize}rem` : 'clamp(2rem, 10vw, 10rem)';
        this.fontWeight = options.fontWeight || 900;
        this.fontFamily = options.fontFamily || 'VT323, monospace';
        this.color = options.color || '#fff';
        this.baseIntensity = options.baseIntensity || 0.18;
        this.hoverIntensity = options.hoverIntensity || 0.5;
        this.enableHover = options.enableHover || false;
        this.multiline = options.multiline || false;
        this.lineHeight = options.lineHeight || 1.4;

        this.animationFrameId = null;
        this.isCancelled = false;
        this.isHovering = false;
        this.offscreen = document.createElement('canvas');
        this.offCtx = this.offscreen.getContext('2d');
        this.fuzzRange = 30;

        this.init();
    }

    async init() {
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }
        if (this.isCancelled || !this.offCtx) return;

        const lines = this.multiline ? this.text.split('\n') : [this.text];

        let numericFontSize;
        const temp = document.createElement('span');
        temp.style.fontSize = this.fontSize;
        temp.style.fontFamily = this.fontFamily;
        temp.style.fontWeight = this.fontWeight;
        temp.style.visibility = 'hidden';
        document.body.appendChild(temp);
        const computedSize = window.getComputedStyle(temp).fontSize;
        numericFontSize = parseFloat(computedSize);
        document.body.removeChild(temp);

        this.offCtx.font = `${this.fontWeight} ${computedSize} ${this.fontFamily}`;
        this.offCtx.textBaseline = 'alphabetic';

        let maxTextBoundingWidth = 0;
        let totalHeight = 0;
        let allMetrics = [];

        lines.forEach((line, index) => {
            const metrics = this.offCtx.measureText(line);
            const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
            const actualRight = metrics.actualBoundingBoxRight ?? metrics.width;
            const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize;
            const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2;
            const textBoundingWidth = Math.ceil(actualLeft + actualRight);
            const tightHeight = Math.ceil(actualAscent + actualDescent);

            if (textBoundingWidth > maxTextBoundingWidth) {
                maxTextBoundingWidth = textBoundingWidth;
            }
            if (index > 0) {
                totalHeight += (numericFontSize * this.lineHeight) - tightHeight;
            }
            totalHeight += tightHeight;

            allMetrics.push({ line, metrics, actualLeft, actualAscent, textBoundingWidth });
        });

        this.tightHeight = Math.ceil(totalHeight);
        const extraWidthBuffer = 10;
        this.offscreenWidth = maxTextBoundingWidth + extraWidthBuffer;

        this.offscreen.width = this.offscreenWidth;
        this.offscreen.height = this.tightHeight;

        this.offCtx.font = `${this.fontWeight} ${computedSize} ${this.fontFamily}`;
        this.offCtx.textBaseline = 'alphabetic';
        this.offCtx.fillStyle = this.color;

        let currentY = 0;
        allMetrics.forEach(({ line, metrics, actualLeft, actualAscent }, index) => {
            if (index > 0) {
                currentY += (numericFontSize * this.lineHeight);
            } else {
                currentY = actualAscent;
            }
            this.offCtx.fillText(line, (extraWidthBuffer / 2) - actualLeft, currentY);
        });

        const horizontalMargin = 50;
        const verticalMargin = this.fuzzRange;
        this.canvas.width = this.offscreenWidth + horizontalMargin * 2;
        this.canvas.height = this.tightHeight + verticalMargin * 2;
        this.ctx.translate(horizontalMargin, verticalMargin);

        if (this.enableHover) {
            this.canvas.addEventListener('mousemove', this.handleMouseMove);
            this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
        }

        this.run();
    }

    run = () => {
        if (this.isCancelled) return;

        this.ctx.clearRect(
            -this.fuzzRange, -this.fuzzRange,
            this.offscreenWidth + 2 * this.fuzzRange, this.tightHeight + 2 * this.fuzzRange
        );

        const intensity = this.isHovering ? this.hoverIntensity : this.baseIntensity;

        for (let j = 0; j < this.tightHeight; j++) {
            const dx = Math.floor(intensity * (Math.random() - 0.5) * this.fuzzRange);
            this.ctx.drawImage(
                this.offscreen,
                0, j, this.offscreenWidth, 1,
                dx, j, this.offscreenWidth, 1
            );
        }

        this.animationFrameId = window.requestAnimationFrame(this.run);
    }

    updateText(newText) {
        if (this.text === newText) return;
        this.text = newText;

        this.destroy(false);
        this.isCancelled = false;
        this.init();
    }

    destroy(fullDestroy = true) {
        this.isCancelled = true;
        if (this.animationFrameId) {
            window.cancelAnimationFrame(this.animationFrameId);
        }
        if (fullDestroy && this.enableHover) {
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
        }
    }

    // --- Handlers Hover ---
    handleMouseMove = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.isHovering = true;
    }

    handleMouseLeave = () => {
        this.isHovering = false;
    }
}
