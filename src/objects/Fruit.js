// Fruit class - represents a single fruit with physics
class Fruit {
    constructor(scene, x, y, fruitConfig, body) {
        this.scene = scene;
        this.config = fruitConfig;
        this.merged = false; // Flag to prevent multiple merges
        this.dropTime = null; // Track when fruit was dropped
        this.hasSquished = false; // Track if this fruit has already squished (one-time effect)

        // Use the provided physics body
        this.body = body;

        // Store reference to this Fruit object in the physics body
        this.body.gameObject = this;

        // Create visual representation (bubble + emoji)
        this.bubble = null;
        this.text = null;
        this.updateGraphics();
    }

    // Stub event emitter methods to prevent Phaser errors
    emit() {
        // No-op: Phaser tries to emit collision events
        return this;
    }

    on() {
        return this;
    }

    once() {
        return this;
    }

    off() {
        return this;
    }

    updateGraphics() {
        // Create bubble background if it doesn't exist
        if (!this.bubble) {
            // Create a semi-transparent circle to show the hitbox
            this.bubble = this.scene.add.circle(
                this.body.position.x,
                this.body.position.y,
                this.config.radius,
                this.config.color,
                0.25  // 25% opacity for subtle effect
            );

            // Add a subtle border
            this.bubble.setStrokeStyle(2, this.config.color, 0.4);
        }

        // Add emoji text on top of bubble
        if (!this.text) {
            this.text = this.scene.add.text(
                this.body.position.x,
                this.body.position.y,
                this.config.emoji || this.config.name.charAt(0).toUpperCase(),
                {
                    fontSize: `${this.config.radius * 1.5}px`,
                    fontFamily: 'Arial, sans-serif'
                }
            );
            this.text.setOrigin(0.5, 0.5);
            this.text.setDepth(1); // Ensure emoji is on top of bubble
        }
    }

    update() {
        // Update graphics position to match physics body
        this.updateGraphics();

        // Update bubble position and rotation
        if (this.bubble) {
            this.bubble.setPosition(this.body.position.x, this.body.position.y);
            this.bubble.setRotation(this.body.angle);
        }

        // Update text position and rotation
        if (this.text) {
            this.text.setPosition(this.body.position.x, this.body.position.y);
            // Rotate the emoji to match the physics body rotation
            this.text.setRotation(this.body.angle);
        }
    }

    destroy() {
        if (this.bubble) {
            this.bubble.destroy();
        }
        if (this.text) {
            this.text.destroy();
        }
        this.scene.matter.world.remove(this.body);
    }

    getFruitType() {
        return this.config.name;
    }

    getNextFruitType() {
        return this.config.next;
    }

    getPoints() {
        return this.config.points;
    }

    squish() {
        // Don't squish if already done or merged
        if (this.hasSquished || this.merged) return;

        this.hasSquished = true;

        // Calculate squish amount based on impact (subtle effect)
        const squishScale = 0.85 + (Math.random() * 0.05); // 0.85-0.9 scale
        const bounceScale = 1.08 + (Math.random() * 0.04); // 1.08-1.12 scale

        // Squish animation
        this.scene.tweens.add({
            targets: [this.bubble, this.text],
            scaleX: squishScale,
            scaleY: squishScale,
            duration: 80,
            ease: 'Quad.easeOut',
            onComplete: () => {
                // Bounce back
                this.scene.tweens.add({
                    targets: [this.bubble, this.text],
                    scaleX: bounceScale,
                    scaleY: bounceScale,
                    duration: 100,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        // Settle to normal
                        this.scene.tweens.add({
                            targets: [this.bubble, this.text],
                            scaleX: 1,
                            scaleY: 1,
                            duration: 120,
                            ease: 'Elastic.easeOut'
                        });
                    }
                });
            }
        });
    }
}
