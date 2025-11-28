// This function defines the Monster module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the monster
// - `y` - The initial y position of the monster
// - `gameArea` - The bounding box of the game area
const Monster = function(ctx, x, y, gameArea) {
    
    const sprite_height = 64;
    const sprite_width = 64;

    // This is the sprite sequences of the monster facing different directions.
    // Assuming similar layout to player for simplicity; adjust as needed for actual spritesheet.
    const sequences = {
        /* Moving sprite sequences for facing different directions */
        moveLeft:  { x: 0, y: 576, width: 64, height: 64, count: 8, timing: 50, loop: true },
        moveRight: { x: 0, y: 703, width: 64, height: 64, count: 8, timing: 50, loop: true },
    };

    // This is the sprite object of the monster created from the Sprite module.
    const sprite = Sprite(ctx, x, y);

    // This is the moving direction: 1=Left, 3=Right
    let direction = Math.random() > 0.5 ? 1 : 3;

    // The sprite object is configured for the monster sprite here.
    // Assuming a separate spritesheet; replace with actual path if different.
    sprite.setSequence(direction === 1 ? sequences.moveLeft : sequences.moveRight)
          .setScale(2)
          .setShadowScale({ x: 0.75, y: 0.20 })
          .useSheet("res/character-spritesheet.png");

    // Speed
    let speed = 50; // Speed for walking (pixels per second)

    // --- Physics Variables ---
    const GRAVITY_ACCEL = 1500; // Gravity acceleration (pixels/sec^2)
    let velocityY = 0; // Current vertical velocity (pixels/sec)

    // Track previous direction to detect changes
    let prevDirection = direction;

    const getBoundingBox = function() {
        let { x, y } = sprite.getXY();
        let halfWidth = sprite_width / 2;
        let halfheight = sprite_height / 2;

        let left = x-halfWidth;
        let right = x+halfWidth;
        let top = y-halfheight;
        let bottom = y+sprite_height;

        // Assuming BoundingBox takes ctx, top, left, bottom, right 
        return BoundingBox(ctx, top, left, bottom, right);
    };
    // This function updates the monster.
    // - `time` - The timestamp when this function is called
    const update = function(time) {
        let { x, y } = sprite.getXY();

        // Set sequence only if direction changed
        if (direction !== prevDirection) {
            sprite.setSequence(direction === 1 ? sequences.moveLeft : sequences.moveRight);
            prevDirection = direction;
        }

        /* Move the monster */
        switch (direction) {
            case 1: x -= speed / 60; break;
            case 3: x += speed / 60; break;
        }

        // Vertical Physics (Gravity)
        velocityY += GRAVITY_ACCEL / 60;
        y += velocityY / 60;

        // Check if hit the ground
        if (y > gameArea.getBottom()) {
            velocityY = 0;
            y = gameArea.getBottom();
        }

        // Boundary checks and reverse direction
        if (x < gameArea.getLeft()) {
            x = gameArea.getLeft();
            direction = 3;
        }
        if (x > gameArea.getRight()) {
            x = gameArea.getRight();
            direction = 1;
        }

        // Set position if within game area (approximate check)
        if (gameArea.isPointInBox(x, y)) {
            sprite.setXY(x, y);
        }

        /* Update the sprite object */
        sprite.update(time);
    };

    // The methods are returned as an object here.
    return {
        getBoundingBox: getBoundingBox,
        draw: sprite.draw,
        update: update
    };
};
