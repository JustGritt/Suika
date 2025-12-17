class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Initialize game state
        this.score = 0;
        this.fruits = [];
        this.gameOver = false;

        // Load high score from localStorage
        this.highScore = parseInt(localStorage.getItem('suikaHighScore')) || 0;

        // Track preview fruit position
        this.previewX = CONTAINER_X;
        this.previewFruit = null;

        // Cooldown system - prevent spam clicking
        this.canDrop = true;
        this.lastDroppedFruit = null;

        // Create container
        this.createContainer();

        // Initialize PowerUpManager
        this.powerUpManager = new PowerUpManager(this);

        // Create UI
        this.createUI();

        // Setup collision detection
        this.matter.world.on('collisionstart', (event) => {
            this.handleCollisions(event);
        });

        // Setup input
        this.input.on('pointermove', (pointer) => {
            // Update preview position
            const minX = CONTAINER_X - CONTAINER_WIDTH / 2 + 30;
            const maxX = CONTAINER_X + CONTAINER_WIDTH / 2 - 30;
            this.previewX = Phaser.Math.Clamp(pointer.x, minX, maxX);
        });

        this.input.on('pointerdown', (pointer) => {
            if (!this.gameOver && this.canDrop) {
                // Check if click is in power-up area
                let inPowerUpArea = false;

                if (IS_MOBILE) {
                    // Mobile: power-ups are at the bottom
                    const powerUpBottomY = GAME_HEIGHT - 130; // Power-up area starts here
                    if (pointer.y >= powerUpBottomY) {
                        inPowerUpArea = true;
                    }
                } else {
                    // Desktop: power-ups are on the right side
                    const powerUpAreaLeft = 620;
                    const powerUpAreaRight = 620 + 140 + 20;
                    if (pointer.x >= powerUpAreaLeft && pointer.x <= powerUpAreaRight) {
                        inPowerUpArea = true;
                    }
                }

                if (!inPowerUpArea) {
                    this.dropFruit();
                }
            }
        });

        // Create preview fruit
        this.createPreviewFruit();
    }

    createContainer() {
        // Container background with gradient effect
        const graphics = this.add.graphics();

        // Draw gradient background
        const left = CONTAINER_X - CONTAINER_WIDTH / 2;
        const right = CONTAINER_X + CONTAINER_WIDTH / 2;
        const top = CONTAINER_Y - CONTAINER_HEIGHT / 2;
        const bottom = CONTAINER_Y + CONTAINER_HEIGHT / 2;

        // Light to slightly darker gradient for depth
        graphics.fillGradientStyle(0xf8f8f8, 0xf8f8f8, 0xe8e8e8, 0xe8e8e8, 1);
        graphics.fillRect(left, top, CONTAINER_WIDTH, CONTAINER_HEIGHT);

        // Inner shadow effect for depth
        graphics.lineStyle(2, 0x000000, 0.05);
        graphics.strokeRect(left + 2, top + 2, CONTAINER_WIDTH - 4, CONTAINER_HEIGHT - 4);

        // Danger line with glow effect
        const dangerLineGraphics = this.add.graphics();

        // Outer glow
        dangerLineGraphics.lineStyle(8, 0xff0000, 0.1);
        dangerLineGraphics.beginPath();
        dangerLineGraphics.moveTo(left, GAME_OVER_LINE_Y);
        dangerLineGraphics.lineTo(right, GAME_OVER_LINE_Y);
        dangerLineGraphics.strokePath();

        // Main line
        dangerLineGraphics.lineStyle(3, 0xff0000, 0.6);
        dangerLineGraphics.beginPath();
        dangerLineGraphics.moveTo(left, GAME_OVER_LINE_Y);
        dangerLineGraphics.lineTo(right, GAME_OVER_LINE_Y);
        dangerLineGraphics.strokePath();

        // Dashed effect
        dangerLineGraphics.lineStyle(2, 0xff4444, 0.8);
        for (let x = left; x < right; x += 20) {
            dangerLineGraphics.lineTo(x, GAME_OVER_LINE_Y - 1);
            dangerLineGraphics.moveTo(x + 10, GAME_OVER_LINE_Y - 1);
        }
        dangerLineGraphics.strokePath();
        dangerLineGraphics.setDepth(10);

        // Create walls with better collision properties
        const wallOptions = {
            isStatic: true,
            friction: 0.5,
            restitution: 0.3,
            slop: 0, // No tolerance for penetration
            density: Infinity // Immovable walls
        };

        // Bottom
        this.matter.add.rectangle(
            CONTAINER_X,
            CONTAINER_Y + CONTAINER_HEIGHT / 2 + CONTAINER_WALL_THICKNESS / 2,
            CONTAINER_WIDTH,
            CONTAINER_WALL_THICKNESS,
            wallOptions
        );

        // Left
        this.matter.add.rectangle(
            CONTAINER_X - CONTAINER_WIDTH / 2 - CONTAINER_WALL_THICKNESS / 2,
            CONTAINER_Y,
            CONTAINER_WALL_THICKNESS,
            CONTAINER_HEIGHT,
            wallOptions
        );

        // Right
        this.matter.add.rectangle(
            CONTAINER_X + CONTAINER_WIDTH / 2 + CONTAINER_WALL_THICKNESS / 2,
            CONTAINER_Y,
            CONTAINER_WALL_THICKNESS,
            CONTAINER_HEIGHT,
            wallOptions
        );

        // Border (open top) with depth
        const borderGraphics = this.add.graphics();

        // Shadow/depth effect
        borderGraphics.lineStyle(CONTAINER_WALL_THICKNESS + 4, 0x000000, 0.15);
        borderGraphics.strokeRect(left - 2, top - 2, CONTAINER_WIDTH + 4, CONTAINER_HEIGHT + 4);

        // Main border with gradient effect
        borderGraphics.lineStyle(CONTAINER_WALL_THICKNESS, 0x2a2a2a, 1);

        // Left border
        borderGraphics.beginPath();
        borderGraphics.moveTo(left, top);
        borderGraphics.lineTo(left, bottom);
        borderGraphics.strokePath();

        // Right border
        borderGraphics.beginPath();
        borderGraphics.moveTo(right, top);
        borderGraphics.lineTo(right, bottom);
        borderGraphics.strokePath();

        // Bottom border (thicker for emphasis)
        borderGraphics.lineStyle(CONTAINER_WALL_THICKNESS + 2, 0x1a1a1a, 1);
        borderGraphics.beginPath();
        borderGraphics.moveTo(left, bottom);
        borderGraphics.lineTo(right, bottom);
        borderGraphics.strokePath();

        // Inner highlight for 3D effect
        borderGraphics.lineStyle(2, 0x555555, 0.6);
        borderGraphics.strokeRect(left + CONTAINER_WALL_THICKNESS/2, top + CONTAINER_WALL_THICKNESS/2,
                                   CONTAINER_WIDTH - CONTAINER_WALL_THICKNESS,
                                   CONTAINER_HEIGHT - CONTAINER_WALL_THICKNESS);
    }

    createUI() {
        const titleSize = IS_MOBILE ? '28px' : '42px';
        const scoreSize = IS_MOBILE ? '18px' : '24px';
        const highScoreSize = IS_MOBILE ? '14px' : '20px';
        const instructionSize = IS_MOBILE ? '10px' : '14px';

        // Title with shadow
        const title = this.add.text(GAME_WIDTH / 2, IS_MOBILE ? 10 : 15, 'SUIKA GAME', {
            fontSize: titleSize,
            color: '#333333',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: IS_MOBILE ? 2 : 4
        });
        title.setOrigin(0.5, 0);
        title.setDepth(1000);

        // Score - top left with shadow
        this.scoreText = this.add.text(
            IS_MOBILE ? 10 : 20,
            IS_MOBILE ? 45 : 20,
            'Score: 0',
            {
                fontSize: scoreSize,
                color: '#333333',
                fontStyle: 'bold',
                stroke: '#ffffff',
                strokeThickness: IS_MOBILE ? 1.5 : 2
            }
        );
        this.scoreText.setDepth(1000);

        // High Score - top right with shadow
        const highScoreLabel = IS_MOBILE ? 'High' : 'High Score';
        this.highScoreText = this.add.text(
            GAME_WIDTH - (IS_MOBILE ? 10 : 20),
            IS_MOBILE ? 45 : 20,
            `${highScoreLabel}: ${this.highScore}`,
            {
                fontSize: highScoreSize,
                color: '#666666',
                fontStyle: 'bold',
                stroke: '#ffffff',
                strokeThickness: IS_MOBILE ? 1.5 : 2
            }
        );
        this.highScoreText.setOrigin(1, 0);
        this.highScoreText.setDepth(1000);

        // Instructions - centered below title (only show on desktop)
        if (!IS_MOBILE) {
            const instructions = this.add.text(
                GAME_WIDTH / 2,
                65,
                '🖱️ Click to drop fruit  •  🍒 Match fruits to merge',
                {
                    fontSize: instructionSize,
                    color: '#555555',
                    stroke: '#ffffff',
                    strokeThickness: 1.5
                }
            );
            instructions.setOrigin(0.5, 0);
            instructions.setDepth(1000);
        }
    }

    createPreviewFruit() {
        // Check if a power-up is queued
        let fruitConfig;
        if (this.powerUpManager) {
            const powerUpOverride = this.powerUpManager.getNextFruitOverride();
            fruitConfig = powerUpOverride || getRandomDropFruit();
        } else {
            fruitConfig = getRandomDropFruit();
        }

        const startY = CONTAINER_Y - CONTAINER_HEIGHT / 2 + fruitConfig.radius + 10;

        // Destroy old preview if it exists
        if (this.previewFruit) {
            if (this.previewFruit.bubble) {
                this.previewFruit.bubble.destroy();
            }
            this.previewFruit.text.destroy();
        }

        // Create visual preview (not a physics object) with bubble
        const bubble = this.add.circle(
            0,
            0,
            fruitConfig.radius,
            fruitConfig.color,
            0.25
        );
        bubble.setStrokeStyle(2, fruitConfig.color, 0.4);
        bubble.setDepth(99);

        const text = this.add.text(0, 0, fruitConfig.emoji, {
            fontSize: `${fruitConfig.radius * 1.5}px`,
            fontFamily: 'Arial, sans-serif'
        });
        text.setOrigin(0.5, 0.5);
        text.setDepth(100);

        this.previewFruit = {
            config: fruitConfig,
            bubble: bubble,
            text: text
        };
    }

    setupPowerUpBehavior(fruit, powerUpType) {
        switch(powerUpType) {
            case 'BOMB':
                // Explode on any collision
                const bombCollisionHandler = (event) => {
                    event.pairs.forEach(pair => {
                        const bodyA = pair.bodyA;
                        const bodyB = pair.bodyB;

                        // Check if bomb collided with any fruit
                        if ((bodyA.gameObject === fruit && bodyB.gameObject instanceof Fruit) ||
                            (bodyB.gameObject === fruit && bodyA.gameObject instanceof Fruit)) {

                            if (this.powerUpManager) {
                                this.powerUpManager.explodeBomb(fruit);
                            }
                            this.matter.world.off('collisionstart', bombCollisionHandler);
                        }
                    });
                };
                this.matter.world.on('collisionstart', bombCollisionHandler);
                break;

            case 'SHRINK':
                // Shrink fruits in radius on collision
                const shrinkCollisionHandler = (event) => {
                    event.pairs.forEach(pair => {
                        const bodyA = pair.bodyA;
                        const bodyB = pair.bodyB;

                        // Check if shrink ray collided with anything
                        if (bodyA.gameObject === fruit || bodyB.gameObject === fruit) {
                            if (this.powerUpManager) {
                                this.powerUpManager.activateShrink(fruit);
                            }
                            this.matter.world.off('collisionstart', shrinkCollisionHandler);
                        }
                    });
                };
                this.matter.world.on('collisionstart', shrinkCollisionHandler);
                break;

            case 'FREEZE':
                // Freeze all fruits on collision
                const freezeCollisionHandler = (event) => {
                    event.pairs.forEach(pair => {
                        const bodyA = pair.bodyA;
                        const bodyB = pair.bodyB;

                        if ((bodyA.gameObject === fruit && bodyB.gameObject instanceof Fruit) ||
                            (bodyB.gameObject === fruit && bodyA.gameObject instanceof Fruit)) {

                            if (this.powerUpManager) {
                                this.powerUpManager.activateFreeze();
                                this.removeFruit(fruit);
                            }
                            this.matter.world.off('collisionstart', freezeCollisionHandler);
                        }
                    });
                };
                this.matter.world.on('collisionstart', freezeCollisionHandler);
                break;

            case 'RAINBOW':
                // Rainbow can merge with any fruit type
                fruit.isRainbow = true;
                break;
        }
    }

    dropFruit(skipPreviewCreation = false) {
        if (!this.previewFruit || !this.canDrop) return;

        const config = this.previewFruit.config;

        // Calculate drop position accounting for fruit shape
        // For oval/elongated shapes, we need extra vertical space
        let heightMultiplier = 1;
        if (config.shape === 'oval' || config.shape === 'cone') {
            heightMultiplier = 1.3;
        } else if (config.shape === 'pear' || config.shape === 'pineapple') {
            heightMultiplier = 1.5;
        }

        const dropY = CONTAINER_Y - CONTAINER_HEIGHT / 2 + config.radius * heightMultiplier + 10;

        // Create actual physics fruit with custom shape
        const body = createFruitBody(this, this.previewX, dropY, config);

        const fruit = new Fruit(this, this.previewX, dropY, config, body);

        this.fruits.push(fruit);

        // Set cooldown - can't drop another fruit until this one collides
        this.canDrop = false;
        this.lastDroppedFruit = fruit;

        // Handle power-up special behaviors
        if (config.isPowerUp) {
            this.setupPowerUpBehavior(fruit, config.powerUpType);
        }

        // Create new preview (unless skipped by power-up)
        if (!skipPreviewCreation) {
            this.createPreviewFruit();
        }
    }

    handleCollisions(event) {
        event.pairs.forEach(pair => {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;

            // Check if the last dropped fruit has collided with anything
            if (this.lastDroppedFruit) {
                const droppedFruit = this.lastDroppedFruit;

                if (bodyA.gameObject === droppedFruit || bodyB.gameObject === droppedFruit) {
                    // Re-enable dropping once the fruit has collided
                    this.canDrop = true;

                    // Trigger squish animation on first impact only
                    droppedFruit.squish();

                    // If it hit another fruit, squish that one too
                    if (bodyA.gameObject instanceof Fruit && bodyA.gameObject !== droppedFruit) {
                        bodyA.gameObject.squish();
                    }
                    if (bodyB.gameObject instanceof Fruit && bodyB.gameObject !== droppedFruit) {
                        bodyB.gameObject.squish();
                    }

                    this.lastDroppedFruit = null;
                }
            }

            if (bodyA.gameObject instanceof Fruit && bodyB.gameObject instanceof Fruit) {
                const fruitA = bodyA.gameObject;
                const fruitB = bodyB.gameObject;

                // Don't merge power-up fruits (except rainbow)
                const aIsPowerUp = fruitA.config.isPowerUp && fruitA.config.powerUpType !== 'RAINBOW';
                const bIsPowerUp = fruitB.config.isPowerUp && fruitB.config.powerUpType !== 'RAINBOW';

                if (aIsPowerUp || bIsPowerUp) {
                    return; // Skip merging for power-up fruits
                }

                // Check for rainbow merging
                const aIsRainbow = fruitA.isRainbow || fruitA.config.powerUpType === 'RAINBOW';
                const bIsRainbow = fruitB.isRainbow || fruitB.config.powerUpType === 'RAINBOW';

                if (aIsRainbow || bIsRainbow) {
                    // Rainbow can merge with anything (except other rainbows)
                    if (!(aIsRainbow && bIsRainbow) && !fruitA.merged && !fruitB.merged) {
                        // Use the non-rainbow fruit's next type
                        const normalFruit = aIsRainbow ? fruitB : fruitA;
                        if (normalFruit.getNextFruitType() !== null) {
                            fruitA.merged = true;
                            fruitB.merged = true;
                            this.mergeFruits(fruitA, fruitB);
                        }
                    }
                } else if (fruitA.getFruitType() === fruitB.getFruitType() &&
                    !fruitA.merged && !fruitB.merged &&
                    fruitA.getNextFruitType() !== null) {

                    fruitA.merged = true;
                    fruitB.merged = true;
                    this.mergeFruits(fruitA, fruitB);
                }
            }
        });
    }

    mergeFruits(fruitA, fruitB) {
        const mergeX = (fruitA.body.position.x + fruitB.body.position.x) / 2;
        const mergeY = (fruitA.body.position.y + fruitB.body.position.y) / 2;

        // Determine which fruit to use for the next type
        const aIsRainbow = fruitA.isRainbow || fruitA.config.powerUpType === 'RAINBOW';
        const bIsRainbow = fruitB.isRainbow || fruitB.config.powerUpType === 'RAINBOW';

        let nextFruitType;
        if (aIsRainbow) {
            nextFruitType = fruitB.getNextFruitType();
        } else if (bIsRainbow) {
            nextFruitType = fruitA.getNextFruitType();
        } else {
            nextFruitType = fruitA.getNextFruitType();
        }

        const nextFruitConfig = getFruitByName(nextFruitType);

        this.addScore(fruitA.getPoints() + fruitB.getPoints());

        this.removeFruit(fruitA);
        this.removeFruit(fruitB);

        // Create merged fruit with custom shape
        const body = createFruitBody(this, mergeX, mergeY, nextFruitConfig);

        const newFruit = new Fruit(this, mergeX, mergeY, nextFruitConfig, body);

        this.fruits.push(newFruit);

        // Merge effect
        const circle = this.add.circle(mergeX, mergeY, 20, nextFruitConfig.color, 0.6);
        this.tweens.add({
            targets: circle,
            radius: 60,
            alpha: 0,
            duration: 300,
            onComplete: () => circle.destroy()
        });
    }

    removeFruit(fruit) {
        const index = this.fruits.indexOf(fruit);
        if (index > -1) this.fruits.splice(index, 1);
        fruit.destroy();
    }

    addScore(points) {
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);

        // Update power-ups based on score
        if (this.powerUpManager) {
            this.powerUpManager.update();
        }

        // Update high score if beaten
        if (this.score > this.highScore) {
            this.highScore = this.score;
            const highScoreLabel = IS_MOBILE ? 'High' : 'High Score';
            this.highScoreText.setText(`${highScoreLabel}: ${this.highScore}`);
            localStorage.setItem('suikaHighScore', this.highScore.toString());

            // Add visual feedback for new high score
            this.highScoreText.setColor('#ff6600');
            this.tweens.add({
                targets: this.highScoreText,
                scale: 1.1,
                duration: 200,
                yoyo: true,
                onComplete: () => {
                    this.highScoreText.setScale(1);
                }
            });
        }
    }

    checkGameOver() {
        // Check if any fruit has been above the danger line for too long
        const currentTime = this.time.now;

        for (let fruit of this.fruits) {
            const fruitY = fruit.body.position.y;
            const fruitTop = fruitY - fruit.config.radius;

            // If fruit is above danger line
            if (fruitTop < GAME_OVER_LINE_Y) {
                // Initialize warning time if not set
                if (!fruit.warningTime) {
                    fruit.warningTime = currentTime;
                }

                // If fruit has been above line for more than 3 seconds
                if (currentTime - fruit.warningTime > 3000) {
                    return true;
                }
            } else {
                // Fruit is below line, reset warning
                fruit.warningTime = null;
            }
        }

        return false;
    }

    triggerGameOver() {
        this.gameOver = true;

        // Stop physics
        this.matter.world.pause();

        // Create game over overlay
        const overlay = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x000000,
            0.7
        );
        overlay.setDepth(1000);

        // Game Over text
        const gameOverText = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 - 50,
            'GAME OVER',
            {
                fontSize: IS_MOBILE ? '40px' : '64px',
                color: '#ff0000',
                fontStyle: 'bold'
            }
        );
        gameOverText.setOrigin(0.5);
        gameOverText.setDepth(1001);

        // Final Score
        const isNewHighScore = this.score === this.highScore && this.score > 0;
        const finalScore = this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 20,
            `Final Score: ${this.score}`,
            {
                fontSize: IS_MOBILE ? '24px' : '32px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        );
        finalScore.setOrigin(0.5);
        finalScore.setDepth(1001);

        // New High Score message
        if (isNewHighScore) {
            const newHighScoreText = this.add.text(
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 + 60,
                '🎉 NEW HIGH SCORE! 🎉',
                {
                    fontSize: IS_MOBILE ? '18px' : '24px',
                    color: '#ffd700',
                    fontStyle: 'bold'
                }
            );
            newHighScoreText.setOrigin(0.5);
            newHighScoreText.setDepth(1001);

            // Make it pulse
            this.tweens.add({
                targets: newHighScoreText,
                scale: 1.1,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }

        // Restart instruction
        const restartY = isNewHighScore ? GAME_HEIGHT / 2 + 110 : GAME_HEIGHT / 2 + 70;
        const restartText = this.add.text(
            GAME_WIDTH / 2,
            restartY,
            IS_MOBILE ? 'Tap to Restart' : 'Click to Restart',
            {
                fontSize: IS_MOBILE ? '18px' : '24px',
                color: '#ffff00'
            }
        );
        restartText.setOrigin(0.5);
        restartText.setDepth(1001);

        // Make it blink
        this.tweens.add({
            targets: restartText,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Add restart functionality
        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }

    update() {
        // Check for game over
        if (!this.gameOver && this.checkGameOver()) {
            this.triggerGameOver();
        }

        // Update preview position and visual state
        if (this.previewFruit && !this.gameOver) {
            const startY = CONTAINER_Y - CONTAINER_HEIGHT / 2 + this.previewFruit.config.radius + 10;

            // Update bubble and emoji position
            if (this.previewFruit.bubble) {
                this.previewFruit.bubble.setPosition(this.previewX, startY);
            }
            this.previewFruit.text.setPosition(this.previewX, startY);

            // Visual feedback: dim preview when on cooldown
            if (this.canDrop) {
                if (this.previewFruit.bubble) {
                    this.previewFruit.bubble.setAlpha(0.25);
                }
                this.previewFruit.text.setAlpha(1);
            } else {
                if (this.previewFruit.bubble) {
                    this.previewFruit.bubble.setAlpha(0.1);
                }
                this.previewFruit.text.setAlpha(0.4);
            }
        }

        // Update all fruits
        this.fruits.forEach(fruit => fruit.update());
    }
}
