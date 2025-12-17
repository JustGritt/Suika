// Main game configuration
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#f0f0f0',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false, // Set to true to see collision boundaries
            enableSleeping: false, // Disable sleeping to prevent tunneling
            positionIterations: 6, // Increase for better collision accuracy
            velocityIterations: 4,
            constraintIterations: 2
        }
    },
    pixelArt: true, // Enable pixel art mode for crisp pixels
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    },
    scene: [GameScene]
};

// Create and start the game
const game = new Phaser.Game(config);
