// PowerUpManager - Handles power-up selection and activation
class PowerUpManager {
    constructor(scene) {
        this.scene = scene;
        this.availablePowerUps = [];
        this.queuedPowerUp = null; // Power-up queued for next fruit
        this.powerUpButtons = [];
        this.unlockedPowerUps = new Set(); // Track which have been unlocked to avoid duplicate notifications

        // Progression system - unlock charges as player progresses
        this.powerUpCharges = {
            'BOMB': 0,      // Will be awarded by first milestone
            'RAINBOW': 0,   // Start locked
            'SHRINK': 0,    // Start locked
            'FREEZE': 0     // Start locked
        };

        // Define progression milestones
        this.progressionMilestones = [
            { score: 0, reward: 'BOMB', amount: 1, description: 'Start with 1 Bomb' },
            { score: 20, reward: 'BOMB', amount: 1, description: '+1 Bomb charge' },
            { score: 40, reward: 'RAINBOW', amount: 1, description: 'Unlock Rainbow!' },
            { score: 60, reward: 'BOMB', amount: 1, description: '+1 Bomb charge' },
            { score: 80, reward: 'RAINBOW', amount: 1, description: '+1 Rainbow charge' },
            { score: 100, reward: 'SHRINK', amount: 1, description: 'Unlock Shrink Ray!' },
            { score: 130, reward: 'SHRINK', amount: 1, description: '+1 Shrink charge' },
            { score: 160, reward: 'FREEZE', amount: 1, description: 'Unlock Time Freeze!' },
            { score: 200, reward: 'BOMB', amount: 1, description: '+1 Bomb charge' }
        ];

        // Track which milestones have been claimed
        this.claimedMilestones = new Set();

        // Initialize available power-ups based on score
        this.updateAvailablePowerUps();

        // Create UI
        this.createPowerUpUI();

        // Create progress bar
        this.createProgressBar();
    }

    updateAvailablePowerUps() {
        // Check for milestone unlocks
        const score = this.scene.score;

        this.progressionMilestones.forEach((milestone, index) => {
            if (score >= milestone.score && !this.claimedMilestones.has(index)) {
                this.claimedMilestones.add(index);

                // Add charges
                this.powerUpCharges[milestone.reward] += milestone.amount;

                // Show notification
                const powerUp = POWERUPS[milestone.reward];
                this.showUnlockNotification(`${powerUp.emoji} ${milestone.description}`);

                // Track first-time unlock
                if (!this.unlockedPowerUps.has(milestone.reward)) {
                    this.unlockedPowerUps.add(milestone.reward);
                }
            }
        });

        // Build available power-ups list (anything with charges > 0)
        const newAvailablePowerUps = [];
        Object.keys(this.powerUpCharges).forEach(key => {
            if (this.powerUpCharges[key] > 0) {
                newAvailablePowerUps.push(key);
            }
        });

        this.availablePowerUps = newAvailablePowerUps;

        // Update progress bar
        this.updateProgressBar();
    }

    createPowerUpUI() {
        if (IS_MOBILE) {
            this.createMobilePowerUpUI();
        } else {
            this.createDesktopPowerUpUI();
        }
    }

    createMobilePowerUpUI() {
        const bottomY = GAME_HEIGHT - 70;
        const buttonWidth = 70;
        const buttonHeight = 70;
        const spacing = 10;
        const totalWidth = (buttonWidth * 4) + (spacing * 3);
        const startX = (GAME_WIDTH - totalWidth) / 2;

        // Title (smaller for mobile)
        this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 95, 'Power-Ups', {
            fontSize: '14px',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(1000);

        // Create buttons for each power-up type
        Object.keys(POWERUPS).forEach((key, index) => {
            const powerUp = POWERUPS[key];
            const x = startX + (buttonWidth / 2) + (index * (buttonWidth + spacing));

            // Button background
            const button = this.scene.add.rectangle(
                x,
                bottomY,
                buttonWidth,
                buttonHeight,
                0xcccccc
            ).setInteractive();
            button.setDepth(1000);

            // Power-up icon (emoji)
            const icon = this.scene.add.text(
                x,
                bottomY - 8,
                powerUp.emoji || '⭐',
                {
                    fontSize: '28px',
                    fontFamily: 'Arial, sans-serif'
                }
            );
            icon.setOrigin(0.5, 0.5);
            icon.setDepth(1001);

            // Charge counter
            const chargeText = this.scene.add.text(
                x,
                bottomY + 20,
                `x${this.powerUpCharges[key]}`,
                {
                    fontSize: '14px',
                    color: '#ff6600',
                    fontStyle: 'bold'
                }
            );
            chargeText.setOrigin(0.5, 0.5);
            chargeText.setDepth(1001);

            // Store references (no text/desc for mobile)
            const buttonObj = {
                key,
                button,
                icon,
                text: null,
                desc: null,
                chargeText,
                locked: true
            };

            this.powerUpButtons.push(buttonObj);

            // Click handler
            button.on('pointerdown', () => {
                if (!buttonObj.locked) {
                    this.queuePowerUp(key);
                }
            });

            // Hover effect
            button.on('pointerover', () => {
                if (!buttonObj.locked) {
                    button.setFillStyle(0xaaaaaa);
                }
            });

            button.on('pointerout', () => {
                if (this.queuedPowerUp === key) {
                    button.setFillStyle(0xffaa00);
                } else {
                    button.setFillStyle(buttonObj.locked ? 0xcccccc : 0xcccccc);
                }
            });
        });

        this.updateButtonStates();
    }

    createDesktopPowerUpUI() {
        const startX = 620;
        const startY = 100;
        const spacing = 80;

        // Title with shadow for better readability
        const title = this.scene.add.text(startX, 50, 'Power-Ups', {
            fontSize: '22px',
            color: '#333333',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 3
        });

        // Instruction
        const instruction = this.scene.add.text(startX, 75, 'Click to queue next', {
            fontSize: '11px',
            color: '#666666',
            stroke: '#ffffff',
            strokeThickness: 2
        });

        // Create buttons for each power-up type
        Object.keys(POWERUPS).forEach((key, index) => {
            const powerUp = POWERUPS[key];
            const y = startY + index * spacing;

            // Create button with depth using graphics
            const btnGraphics = this.scene.add.graphics();

            // Shadow for depth
            btnGraphics.fillStyle(0x000000, 0.15);
            btnGraphics.fillRoundedRect(startX + 2, y - 30 + 2, 160, 65, 8);

            // Main button gradient
            btnGraphics.fillGradientStyle(0xe0e0e0, 0xe0e0e0, 0xd0d0d0, 0xd0d0d0, 1);
            btnGraphics.fillRoundedRect(startX, y - 30, 160, 65, 8);

            // Top highlight for 3D effect
            btnGraphics.fillStyle(0xffffff, 0.3);
            btnGraphics.fillRoundedRect(startX, y - 30, 160, 4, {tl: 8, tr: 8, bl: 0, br: 0});

            // Border
            btnGraphics.lineStyle(2, 0x999999, 1);
            btnGraphics.strokeRoundedRect(startX, y - 30, 160, 65, 8);

            // Create interactive hitbox
            const button = this.scene.add.rectangle(
                startX + 80,
                y,
                160,
                65,
                0x000000,
                0 // Transparent, just for interaction
            ).setInteractive();

            // Power-up icon (emoji) with shadow
            const iconShadow = this.scene.add.text(
                startX + 21,
                y + 1,
                powerUp.emoji || '⭐',
                {
                    fontSize: '26px',
                    fontFamily: 'Arial, sans-serif',
                    color: '#000000'
                }
            );
            iconShadow.setOrigin(0.5, 0.5);
            iconShadow.setAlpha(0.2);

            const icon = this.scene.add.text(
                startX + 20,
                y,
                powerUp.emoji || '⭐',
                {
                    fontSize: '26px',
                    fontFamily: 'Arial, sans-serif'
                }
            );
            icon.setOrigin(0.5, 0.5);

            // Power-up name
            const text = this.scene.add.text(
                startX + 50,
                y - 17,
                powerUp.name,
                {
                    fontSize: '13px',
                    color: '#000000',
                    fontStyle: 'bold',
                    stroke: '#ffffff',
                    strokeThickness: 2
                }
            );

            // Description
            const desc = this.scene.add.text(
                startX + 50,
                y + 3,
                powerUp.description,
                {
                    fontSize: '9px',
                    color: '#333333',
                    stroke: '#ffffff',
                    strokeThickness: 1.5,
                    wordWrap: { width: 100 }
                }
            );

            // Charge counter
            const chargeText = this.scene.add.text(
                startX + 150,
                y - 22,
                `x${this.powerUpCharges[key]}`,
                {
                    fontSize: '16px',
                    color: '#ff6600',
                    fontStyle: 'bold',
                    stroke: '#ffffff',
                    strokeThickness: 2
                }
            );
            chargeText.setOrigin(1, 0);

            // Store references
            const buttonObj = {
                key,
                button,
                btnGraphics,
                icon,
                iconShadow,
                text,
                desc,
                chargeText,
                locked: true
            };

            this.powerUpButtons.push(buttonObj);

            // Click handler with animation
            button.on('pointerdown', () => {
                if (!buttonObj.locked) {
                    // Button press animation
                    this.scene.tweens.add({
                        targets: [icon, iconShadow, text, desc, chargeText],
                        y: '+=2',
                        duration: 50,
                        yoyo: true
                    });
                    this.queuePowerUp(key);
                }
            });

            // Hover effect
            button.on('pointerover', () => {
                if (!buttonObj.locked) {
                    // Hover glow effect
                    btnGraphics.clear();
                    btnGraphics.fillStyle(0x000000, 0.15);
                    btnGraphics.fillRoundedRect(startX + 2, y - 30 + 2, 160, 65, 8);
                    btnGraphics.fillGradientStyle(0xf0f0f0, 0xf0f0f0, 0xe0e0e0, 0xe0e0e0, 1);
                    btnGraphics.fillRoundedRect(startX, y - 30, 160, 65, 8);
                    btnGraphics.fillStyle(0xffffff, 0.4);
                    btnGraphics.fillRoundedRect(startX, y - 30, 160, 4, {tl: 8, tr: 8, bl: 0, br: 0});
                    btnGraphics.lineStyle(2, 0x888888, 1);
                    btnGraphics.strokeRoundedRect(startX, y - 30, 160, 65, 8);
                }
            });

            button.on('pointerout', () => {
                this.updateButtonGraphics(buttonObj, startX, y);
            });
        });

        this.updateButtonStates();
    }

    updateButtonGraphics(btn, x, y) {
        if (!btn.btnGraphics) return; // Mobile buttons don't have graphics

        const isQueued = this.queuedPowerUp === btn.key;

        btn.btnGraphics.clear();

        // Shadow
        btn.btnGraphics.fillStyle(0x000000, 0.15);
        btn.btnGraphics.fillRoundedRect(x + 2, y - 30 + 2, 160, 65, 8);

        // Button fill
        if (btn.locked) {
            btn.btnGraphics.fillStyle(0x888888, 1);
        } else if (isQueued) {
            btn.btnGraphics.fillGradientStyle(0xffcc66, 0xffcc66, 0xff9933, 0xff9933, 1);
        } else {
            btn.btnGraphics.fillGradientStyle(0xe0e0e0, 0xe0e0e0, 0xd0d0d0, 0xd0d0d0, 1);
        }
        btn.btnGraphics.fillRoundedRect(x, y - 30, 160, 65, 8);

        // Top highlight
        if (!btn.locked) {
            btn.btnGraphics.fillStyle(0xffffff, 0.3);
            btn.btnGraphics.fillRoundedRect(x, y - 30, 160, 4, {tl: 8, tr: 8, bl: 0, br: 0});
        }

        // Border
        btn.btnGraphics.lineStyle(2, btn.locked ? 0x666666 : (isQueued ? 0xff6600 : 0x999999), 1);
        btn.btnGraphics.strokeRoundedRect(x, y - 30, 160, 65, 8);
    }

    updateButtonStates() {
        this.powerUpButtons.forEach((btn, index) => {
            const isAvailable = this.availablePowerUps.includes(btn.key);
            const hasCharges = this.powerUpCharges[btn.key] > 0;
            btn.locked = !isAvailable || !hasCharges;

            // Update charge display
            btn.chargeText.setText(`x${this.powerUpCharges[btn.key]}`);
            btn.chargeText.setColor(hasCharges ? '#ff6600' : '#888888');

            // Update text colors
            if (btn.text) {
                btn.text.setColor(btn.locked ? '#555555' : '#333333');
            }
            if (btn.desc) {
                btn.desc.setColor(btn.locked ? '#555555' : '#666666');
            }

            // Update desktop button graphics
            if (btn.btnGraphics) {
                const startX = 620;
                const startY = 100;
                const spacing = 80;
                const y = startY + index * spacing;
                this.updateButtonGraphics(btn, startX, y);
            }

            // Update mobile button style
            if (!btn.btnGraphics && btn.button) {
                if (btn.locked) {
                    btn.button.setFillStyle(0x888888);
                } else {
                    btn.button.setFillStyle(this.queuedPowerUp === btn.key ? 0xffaa00 : 0xcccccc);
                }
            }
        });
    }

    queuePowerUp(key) {
        // Check if power-up has charges
        if (this.powerUpCharges[key] <= 0) {
            return false;
        }

        this.queuedPowerUp = key;
        this.updateButtonStates();
        return true;
    }

    // Called after a fruit is dropped to check if next fruit should be a power-up
    getNextFruitOverride() {
        if (!this.queuedPowerUp) return null;

        const powerUp = this.queuedPowerUp;

        // Consume a charge
        this.powerUpCharges[powerUp]--;
        this.queuedPowerUp = null;
        this.updateButtonStates();

        // Return the power-up config
        return this.createPowerUpFruit(powerUp);
    }

    createPowerUpFruit(powerUpKey) {
        const powerUp = POWERUPS[powerUpKey];

        switch(powerUpKey) {
            case 'BOMB':
                return {
                    name: 'bomb',
                    emoji: powerUp.emoji,
                    radius: 20,
                    color: powerUp.color,
                    points: 0,
                    next: null,
                    shape: 'circle',
                    isPowerUp: true,
                    powerUpType: 'BOMB'
                };
            case 'RAINBOW':
                return {
                    name: 'rainbow',
                    emoji: powerUp.emoji,
                    radius: 20,
                    color: powerUp.color,
                    points: 0,
                    next: null,
                    shape: 'circle',
                    isPowerUp: true,
                    powerUpType: 'RAINBOW'
                };
            case 'SHRINK':
                return {
                    name: 'shrink',
                    emoji: powerUp.emoji,
                    radius: 20,
                    color: powerUp.color,
                    points: 0,
                    next: null,
                    shape: 'circle',
                    isPowerUp: true,
                    powerUpType: 'SHRINK'
                };
            case 'FREEZE':
                return {
                    name: 'freeze',
                    emoji: powerUp.emoji,
                    radius: 20,
                    color: powerUp.color,
                    points: 0,
                    next: null,
                    shape: 'circle',
                    isPowerUp: true,
                    powerUpType: 'FREEZE'
                };
        }
    }


    explodeBomb(bomb) {
        const bombX = bomb.body.position.x;
        const bombY = bomb.body.position.y;
        const explosionRadius = POWERUPS.BOMB.radius;

        // Visual explosion effect
        const explosion = this.scene.add.circle(bombX, bombY, 10, 0xff6600, 0.8);
        explosion.setDepth(50);

        this.scene.tweens.add({
            targets: explosion,
            radius: explosionRadius,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => explosion.destroy()
        });

        // Find and destroy fruits in radius
        const fruitsToDestroy = this.scene.fruits.filter(fruit => {
            if (fruit === bomb) return true;

            const dx = fruit.body.position.x - bombX;
            const dy = fruit.body.position.y - bombY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            return distance < explosionRadius;
        });

        fruitsToDestroy.forEach(fruit => {
            this.scene.removeFruit(fruit);
        });

        // Add some score
        this.scene.addScore(10);
    }


    activateShrink(shrinkRay) {
        const shrinkX = shrinkRay.body.position.x;
        const shrinkY = shrinkRay.body.position.y;
        const shrinkRadius = POWERUPS.SHRINK.radius;
        const shrinkFactor = 0.7;
        const duration = POWERUPS.SHRINK.duration;

        // Visual shrink ray effect
        const shrinkCircle = this.scene.add.circle(shrinkX, shrinkY, 10, 0x00ffff, 0.8);
        shrinkCircle.setDepth(50);

        this.scene.tweens.add({
            targets: shrinkCircle,
            radius: shrinkRadius,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => shrinkCircle.destroy()
        });

        // Store original scales
        const originalSizes = [];

        // Find and shrink fruits in radius
        const fruitsToShrink = this.scene.fruits.filter(fruit => {
            if (fruit === shrinkRay) return false;

            const dx = fruit.body.position.x - shrinkX;
            const dy = fruit.body.position.y - shrinkY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            return distance < shrinkRadius;
        });

        fruitsToShrink.forEach(fruit => {
            originalSizes.push({
                fruit: fruit,
                radius: fruit.config.radius,
                bubbleScale: fruit.bubble ? fruit.bubble.scale : 1,
                textScale: fruit.text ? fruit.text.scale : 1
            });

            // Shrink the fruit config
            fruit.config.radius *= shrinkFactor;

            // Shrink the visual elements (bubble and emoji)
            if (fruit.bubble) {
                fruit.bubble.setScale(fruit.bubble.scale * shrinkFactor);
            }
            if (fruit.text) {
                fruit.text.setScale(fruit.text.scale * shrinkFactor);
            }

            // Shrink the physics body
            this.scene.matter.body.scale(fruit.body, shrinkFactor, shrinkFactor);
        });

        // Remove the shrink ray itself
        this.scene.removeFruit(shrinkRay);

        // Show notification
        const notification = this.scene.add.text(
            GAME_WIDTH / 2,
            IS_MOBILE ? 150 : 100,
            `SHRINK RAY! ${fruitsToShrink.length} fruits shrunk`,
            {
                fontSize: IS_MOBILE ? '16px' : '24px',
                color: '#00ffff',
                fontStyle: 'bold'
            }
        );
        notification.setOrigin(0.5);
        notification.setDepth(100);

        // Restore after duration
        this.scene.time.delayedCall(duration, () => {
            originalSizes.forEach(item => {
                if (item.fruit && item.fruit.body) {
                    // Restore config radius
                    item.fruit.config.radius = item.radius;

                    // Restore visual elements to original scale
                    if (item.fruit.bubble) {
                        item.fruit.bubble.setScale(item.bubbleScale);
                    }
                    if (item.fruit.text) {
                        item.fruit.text.setScale(item.textScale);
                    }

                    // Restore physics body
                    this.scene.matter.body.scale(item.fruit.body, 1 / shrinkFactor, 1 / shrinkFactor);
                }
            });

            notification.destroy();
        });
    }

    activateFreeze() {
        // Pause physics temporarily
        const duration = POWERUPS.FREEZE.duration;

        // Freeze all fruits
        this.scene.fruits.forEach(fruit => {
            this.scene.matter.body.setStatic(fruit.body, true);
        });

        // Show notification
        const notification = this.scene.add.text(
            GAME_WIDTH / 2,
            IS_MOBILE ? 150 : 100,
            'TIME FREEZE!',
            {
                fontSize: IS_MOBILE ? '20px' : '32px',
                color: '#4169e1',
                fontStyle: 'bold'
            }
        );
        notification.setOrigin(0.5);
        notification.setDepth(100);

        // Add a blue overlay
        const overlay = this.scene.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x4169e1,
            0.1
        );
        overlay.setDepth(99);

        // Unfreeze after duration
        this.scene.time.delayedCall(duration, () => {
            this.scene.fruits.forEach(fruit => {
                this.scene.matter.body.setStatic(fruit.body, false);
            });

            notification.destroy();
            overlay.destroy();
        });
    }

    showUnlockNotification(text) {
        const notification = this.scene.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            text,
            {
                fontSize: IS_MOBILE ? '20px' : '32px',
                color: '#ffd700',
                fontStyle: 'bold'
            }
        );
        notification.setOrigin(0.5);
        notification.setDepth(100);

        this.scene.tweens.add({
            targets: notification,
            y: GAME_HEIGHT / 2 - 50,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }

    createProgressBar() {
        if (IS_MOBILE) {
            this.createMobileProgressBar();
        } else {
            this.createDesktopProgressBar();
        }
    }

    createMobileProgressBar() {
        const x = GAME_WIDTH / 2;
        const y = 30;
        const width = GAME_WIDTH - 60;
        const height = 50;

        // Background container
        const bgGraphics = this.scene.add.graphics();
        bgGraphics.fillStyle(0xffffff, 0.9);
        bgGraphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
        bgGraphics.lineStyle(2, 0x999999, 1);
        bgGraphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
        bgGraphics.setDepth(500);

        // Progress bar background
        const barWidth = width - 20;
        const barHeight = 12;
        const barX = x - barWidth / 2;
        const barY = y + 5;

        const barBgGraphics = this.scene.add.graphics();
        barBgGraphics.fillStyle(0xcccccc, 1);
        barBgGraphics.fillRoundedRect(barX, barY, barWidth, barHeight, 6);
        barBgGraphics.setDepth(501);

        // Progress bar fill
        const barFillGraphics = this.scene.add.graphics();
        barFillGraphics.setDepth(502);

        // Next unlock text
        const nextUnlockText = this.scene.add.text(
            x,
            y - 12,
            'Next: Loading...',
            {
                fontSize: '11px',
                color: '#333333',
                fontStyle: 'bold'
            }
        );
        nextUnlockText.setOrigin(0.5);
        nextUnlockText.setDepth(503);

        // Progress text
        const progressText = this.scene.add.text(
            x,
            y + 12,
            '0 / 0',
            {
                fontSize: '9px',
                color: '#666666'
            }
        );
        progressText.setOrigin(0.5);
        progressText.setDepth(503);

        // Store references
        this.progressBar = {
            bgGraphics,
            barBgGraphics,
            barFillGraphics,
            nextUnlockText,
            progressText,
            x: barX,
            y: barY,
            width: barWidth,
            height: barHeight
        };

        this.updateProgressBar();
    }

    createDesktopProgressBar() {
        const x = 620;
        const y = 430;
        const width = 160;
        const height = 80;

        // Background container with depth
        const bgGraphics = this.scene.add.graphics();

        // Shadow
        bgGraphics.fillStyle(0x000000, 0.15);
        bgGraphics.fillRoundedRect(x + 2, y + 2, width, height, 8);

        // Main background
        bgGraphics.fillGradientStyle(0xf0f0f0, 0xf0f0f0, 0xe0e0e0, 0xe0e0e0, 1);
        bgGraphics.fillRoundedRect(x, y, width, height, 8);

        // Top highlight
        bgGraphics.fillStyle(0xffffff, 0.3);
        bgGraphics.fillRoundedRect(x, y, width, 4, {tl: 8, tr: 8, bl: 0, br: 0});

        // Border
        bgGraphics.lineStyle(2, 0x999999, 1);
        bgGraphics.strokeRoundedRect(x, y, width, height, 8);
        bgGraphics.setDepth(500);

        // Title
        const title = this.scene.add.text(
            x + width / 2,
            y + 12,
            'Next Unlock',
            {
                fontSize: '13px',
                color: '#333333',
                fontStyle: 'bold',
                stroke: '#ffffff',
                strokeThickness: 2
            }
        );
        title.setOrigin(0.5);
        title.setDepth(503);

        // Progress bar background
        const barWidth = width - 20;
        const barHeight = 14;
        const barX = x + 10;
        const barY = y + 50;

        const barBgGraphics = this.scene.add.graphics();
        barBgGraphics.fillStyle(0xcccccc, 1);
        barBgGraphics.fillRoundedRect(barX, barY, barWidth, barHeight, 7);
        barBgGraphics.setDepth(501);

        // Progress bar fill
        const barFillGraphics = this.scene.add.graphics();
        barFillGraphics.setDepth(502);

        // Next unlock description
        const nextUnlockText = this.scene.add.text(
            x + width / 2,
            y + 30,
            'Loading...',
            {
                fontSize: '10px',
                color: '#666666',
                stroke: '#ffffff',
                strokeThickness: 1.5,
                wordWrap: { width: width - 20 }
            }
        );
        nextUnlockText.setOrigin(0.5);
        nextUnlockText.setDepth(503);

        // Progress text
        const progressText = this.scene.add.text(
            x + width / 2,
            y + 69,
            '0 / 0',
            {
                fontSize: '9px',
                color: '#666666',
                stroke: '#ffffff',
                strokeThickness: 1.5
            }
        );
        progressText.setOrigin(0.5);
        progressText.setDepth(503);

        // Store references
        this.progressBar = {
            bgGraphics,
            barBgGraphics,
            barFillGraphics,
            title,
            nextUnlockText,
            progressText,
            x: barX,
            y: barY,
            width: barWidth,
            height: barHeight
        };

        this.updateProgressBar();
    }

    updateProgressBar() {
        if (!this.progressBar) return;

        const score = this.scene.score;

        // Find next unclaimed milestone
        let nextMilestone = null;
        for (let i = 0; i < this.progressionMilestones.length; i++) {
            if (!this.claimedMilestones.has(i)) {
                nextMilestone = {
                    ...this.progressionMilestones[i],
                    index: i
                };
                break;
            }
        }

        // Find previous milestone for progress calculation
        let previousMilestoneScore = 0;
        if (nextMilestone) {
            for (let i = nextMilestone.index - 1; i >= 0; i--) {
                if (this.claimedMilestones.has(i)) {
                    previousMilestoneScore = this.progressionMilestones[i].score;
                    break;
                }
            }
        }

        if (nextMilestone) {
            // Calculate progress
            const totalRange = nextMilestone.score - previousMilestoneScore;
            const currentProgress = Math.max(0, score - previousMilestoneScore);
            const progressPercent = Math.min(1, currentProgress / totalRange);

            // Update next unlock text
            const powerUp = POWERUPS[nextMilestone.reward];
            this.progressBar.nextUnlockText.setText(`${powerUp.emoji} ${nextMilestone.description}`);

            // Update progress text
            this.progressBar.progressText.setText(`${score} / ${nextMilestone.score}`);

            // Draw progress bar fill
            this.progressBar.barFillGraphics.clear();
            const fillWidth = this.progressBar.width * progressPercent;

            if (fillWidth > 0) {
                // Gradient fill based on progress
                const color1 = 0xffcc00;
                const color2 = 0xff6600;
                this.progressBar.barFillGraphics.fillGradientStyle(color1, color2, color1, color2, 1);
                this.progressBar.barFillGraphics.fillRoundedRect(
                    this.progressBar.x,
                    this.progressBar.y,
                    fillWidth,
                    this.progressBar.height,
                    6
                );
            }
        } else {
            // All milestones claimed
            this.progressBar.nextUnlockText.setText('🎉 All Unlocked!');
            this.progressBar.progressText.setText('Complete');

            // Full progress bar
            this.progressBar.barFillGraphics.clear();
            this.progressBar.barFillGraphics.fillGradientStyle(0x00ff00, 0x00cc00, 0x00ff00, 0x00cc00, 1);
            this.progressBar.barFillGraphics.fillRoundedRect(
                this.progressBar.x,
                this.progressBar.y,
                this.progressBar.width,
                this.progressBar.height,
                6
            );
        }
    }

    update() {
        // Check for unlocks
        this.updateAvailablePowerUps();
        this.updateButtonStates();
    }
}
