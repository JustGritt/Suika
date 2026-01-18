// Game constants and configuration

// Detect mobile device
const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth < 768;

// Responsive dimensions
const GAME_WIDTH = IS_MOBILE ? Math.min(window.innerWidth, 450) : 800;
const GAME_HEIGHT = IS_MOBILE ? Math.min(window.innerHeight, 800) : 600;

// Container dimensions (adjusted for mobile)
const CONTAINER_WIDTH = IS_MOBILE ? Math.min(GAME_WIDTH - 40, 350) : 400;
const CONTAINER_HEIGHT = IS_MOBILE ? Math.min(GAME_HEIGHT * 0.55, 450) : 500;
const CONTAINER_X = GAME_WIDTH / 2;
const CONTAINER_Y = IS_MOBILE ? (GAME_HEIGHT * 0.35) : (GAME_HEIGHT / 2 + 20);
const CONTAINER_WALL_THICKNESS = 20;

// Game line (danger zone)
const GAME_OVER_LINE_Y = CONTAINER_Y - CONTAINER_HEIGHT / 2 + 80;

// Fruit types and their properties
// Each fruit merges into the next one in the list
// Radii are reduced to match visual representation better
const FRUITS = [
    {
        name: 'cherry',
        emoji: '🍒',
        radius: 12,
        color: 0xff0000,
        points: 1,
        next: 'strawberry',
        shape: 'cherry' // Small circle with stem
    },
    {
        name: 'strawberry',
        emoji: '🍓',
        radius: 16,
        color: 0xff69b4,
        points: 3,
        next: 'grape',
        shape: 'cone' // Slightly conical
    },
    {
        name: 'grape',
        emoji: '🍇',
        radius: 20,
        color: 0x9370db,
        points: 6,
        next: 'orange',
        shape: 'oval' // Slightly oval
    },
    {
        name: 'orange',
        emoji: '🍊',
        radius: 24,
        color: 0xffa500,
        points: 10,
        next: 'apple',
        shape: 'circle' // Perfect circle
    },
    {
        name: 'apple',
        emoji: '🍎',
        radius: 28,
        color: 0xff4444,
        points: 15,
        next: 'pear',
        shape: 'apple' // Circle with small indent at top
    },
    {
        name: 'pear',
        emoji: '🍐',
        radius: 32,
        color: 0x90ee90,
        points: 21,
        next: 'peach',
        shape: 'pear' // Elongated with stem
    },
    {
        name: 'peach',
        emoji: '🍑',
        radius: 36,
        color: 0xffb6c1,
        points: 28,
        next: 'pineapple',
        shape: 'circle' // Round
    },
    {
        name: 'pineapple',
        emoji: '🍍',
        radius: 40,
        color: 0xffd700,
        points: 36,
        next: 'melon',
        shape: 'pineapple' // Oval with spiky top
    },
    {
        name: 'melon',
        emoji: '🍈',
        radius: 44,
        color: 0x7cfc00,
        points: 45,
        next: 'watermelon',
        shape: 'oval' // Slightly oval
    },
    {
        name: 'watermelon',
        emoji: '🍉',
        radius: 52,
        color: 0x228b22,
        points: 100,
        next: 'golden_cherry', // Merges into golden cherry!
        shape: 'circle' // Large circle
    },
    {
        name: 'golden_cherry',
        emoji: '🍒',
        radius: 15,
        color: 0xffd700, // Golden color
        points: 500, // Huge bonus points!
        next: null, // True final fruit
        shape: 'cherry',
        isGolden: true // Special flag for visual effects
    }
];

// Power-up types
const POWERUPS = {
    BOMB: {
        name: 'Bomb',
        emoji: '💣',
        description: 'Clears fruits in a radius',
        color: 0x333333,
        radius: 100
    },
    RAINBOW: {
        name: 'Rainbow',
        emoji: '🌈',
        description: 'Merges with any fruit',
        color: 0xff00ff
    },
    SHRINK: {
        name: 'Shrink Ray',
        emoji: '🔬',
        description: 'Shrinks fruits in a radius',
        color: 0x00ffff,
        radius: 120,
        duration: 5000
    },
    FREEZE: {
        name: 'Time Freeze',
        emoji: '⏰',
        description: 'Pauses physics temporarily',
        color: 0x4169e1,
        duration: 3000
    }
};

// Get fruit config by name
function getFruitByName(name) {
    return FRUITS.find(f => f.name === name);
}

// Get random fruit (only smaller ones for dropping)
function getRandomDropFruit() {
    // Only allow first 5 fruit types to be dropped
    const dropableFruits = FRUITS.slice(0, 5);
    return dropableFruits[Math.floor(Math.random() * dropableFruits.length)];
}

// Get the height offset for fruits with stems/extensions
function getFruitHeightOffset(config) {
    switch (config.shape) {
        case 'cherry':
            return 6; // Stem height
        case 'pear':
            return 8; // Stem height
        case 'pineapple':
            return 12; // Crown height
        case 'apple':
            return 5; // Small indent
        case 'oval':
            return config.radius * 0.3; // Slightly taller
        default:
            return 0;
    }
}

// Create physics body based on fruit shape with detailed vertices
function createFruitBody(scene, x, y, config) {
    const options = {
        restitution: 0.2,
        friction: 0.8,
        density: 0.001,
        label: config.name,
        slop: 0, // No penetration tolerance to prevent tunneling
        isSleeping: false // Never sleep to maintain collision detection
    };

    const r = config.radius;

    switch (config.shape) {
        case 'circle':
            // Use high-resolution circle (more vertices = smoother collision)
            const circleVertices = [];
            const circleSegments = 20;
            for (let i = 0; i < circleSegments; i++) {
                const angle = (i / circleSegments) * Math.PI * 2;
                circleVertices.push({
                    x: Math.cos(angle) * r,
                    y: Math.sin(angle) * r
                });
            }
            return scene.matter.add.fromVertices(x, y, circleVertices, options);

        case 'cherry':
            // Small round cherry shape
            const cherryVertices = [];
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                cherryVertices.push({
                    x: Math.cos(angle) * r * 0.95,
                    y: Math.sin(angle) * r * 0.95
                });
            }
            return scene.matter.add.fromVertices(x, y, cherryVertices, options);

        case 'cone':
            // Strawberry: slightly oval (heart-ish)
            const strawberryVertices = [];
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const radiusX = r * 0.95;
                const radiusY = r * 1.05; // Slightly taller
                strawberryVertices.push({
                    x: Math.cos(angle) * radiusX,
                    y: Math.sin(angle) * radiusY
                });
            }
            return scene.matter.add.fromVertices(x, y, strawberryVertices, options);

        case 'oval':
            // Grape cluster: slightly oval/egg shape
            const grapeVertices = [];
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const radiusX = r * 0.85;
                const radiusY = r * 1.1;
                grapeVertices.push({
                    x: Math.cos(angle) * radiusX,
                    y: Math.sin(angle) * radiusY
                });
            }
            return scene.matter.add.fromVertices(x, y, grapeVertices, options);

        case 'apple':
            // Apple: slightly flattened circle (wider than tall)
            const appleVertices = [];
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const radiusX = r * 1.05; // Slightly wider
                const radiusY = r * 0.95; // Slightly flatter
                appleVertices.push({
                    x: Math.cos(angle) * radiusX,
                    y: Math.sin(angle) * radiusY
                });
            }
            return scene.matter.add.fromVertices(x, y, appleVertices, options);

        case 'pear':
            // Pear: oval shape, taller than wide
            const pearVertices = [];
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const radiusX = r * 0.85; // Narrower
                const radiusY = r * 1.15; // Taller
                pearVertices.push({
                    x: Math.cos(angle) * radiusX,
                    y: Math.sin(angle) * radiusY
                });
            }
            return scene.matter.add.fromVertices(x, y, pearVertices, options);

        case 'pineapple':
            // Pineapple: tall oval
            const pineappleVertices = [];
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const radiusX = r * 0.9;
                const radiusY = r * 1.2; // Taller for pineapple crown
                pineappleVertices.push({
                    x: Math.cos(angle) * radiusX,
                    y: Math.sin(angle) * radiusY
                });
            }
            return scene.matter.add.fromVertices(x, y, pineappleVertices, options);

        default:
            // Default to high-res circle
            const defaultVertices = [];
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                defaultVertices.push({
                    x: Math.cos(angle) * r,
                    y: Math.sin(angle) * r
                });
            }
            return scene.matter.add.fromVertices(x, y, defaultVertices, options);
    }
}
