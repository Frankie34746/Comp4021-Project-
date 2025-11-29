// This function defines the Monster module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the monster
// - `y` - The initial y position of the monster
// - `gameArea` - The bounding box of the game area
const Monster = function(ctx, x, y, gameArea, map, withtreasure = false) {
    // Deterministic ID based on starting position
    const id = `m_${Math.floor(x)}_${Math.floor(y)}`;

    const sprite_height = 64;
    const sprite_width = 64;
    
    // Collision boxes of maps
    let collisionBBs = map.getBoundingBoxlist();

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
    let direction = x < 400 ? 3 : 1;  // Start moving right if left side, left if right side
    
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

    // Get Id
    const getId = function() {
        return id;
    }

    // Get bounding box
    const getBoundingBox = function() {
        let { x, y } = sprite.getXY();
        let halfWidth = sprite_width / 2;
        let halfheight = sprite_height / 2;

        let left = x-halfWidth/2;
        let right = x+halfWidth/2;
        let top = y-halfheight;
        let bottom = y+sprite_height;

        // Assuming BoundingBox takes ctx, top, left, bottom, right 
        return BoundingBox(ctx, top, left, bottom, right);
    };

    const getwithtreasure = function(){
        return withtreasure;
    }

    const droptreasure = function(){
        if (withtreasure){
            let { x, y } = sprite.getXY();
            return treasure(context, x, y);
        }
    }

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

        // Keep monster within bounds horizontally and reverse direction
        if (x < gameArea.getLeft()) {
            x = gameArea.getLeft();
            direction = 3;
        }
        if (x > gameArea.getRight()) {
            x = gameArea.getRight();
            direction = 1;
        }

        let halfWidth = sprite_width / 2;
        let halfheight = sprite_height / 2;
        let left = x-halfWidth/2;
        let right = x+halfWidth/2;
        let top = y-halfheight;
        let bottom = y+sprite_height;
        let currentBox = BoundingBox(ctx, top, left, bottom, right);

        for (let i = 0; i < collisionBBs.length; i++) {
            if (currentBox.intersect(collisionBBs[i])){
                // collision to the block when moving to the left
                if (direction === 1) {
                    const offset = x - currentBox.getLeft();
                    x = collisionBBs[i].getRight() + offset + 0.01;
                    direction = 3;
                    break;
                }
                // collision to the block when moving to the right
                else if (direction === 3){
                    const offset = currentBox.getRight() - x;
                    x = collisionBBs[i].getLeft() - offset - 0.01;
                    direction = 1;
                    break;
                }
            };
        };

        // Vertical Physics (Gravity)
        velocityY += GRAVITY_ACCEL / 60;
        y += velocityY / 60;

        // Check if hit the ground
        if (y > gameArea.getBottom()) {
            velocityY = 0;
            y = gameArea.getBottom();
        }
        // Keep monster within bounds vertically
        if (y < gameArea.getTop()) {
            y = gameArea.getTop();
            velocityY = 0;
        }

        left = x-halfWidth/2;
        right = x+halfWidth/2;
        top = y-halfheight;
        bottom = y+sprite_height;
        currentBox = BoundingBox(ctx, top, left, bottom, right);

        for (let i = 0; i < collisionBBs.length; i++) {
            if (currentBox.intersect(collisionBBs[i])){
                // collision to the block when jumping up
                if (velocityY < 0){
                    velocityY = 0;
                    const offset = y - currentBox.getTop();
                    y = collisionBBs[i].getBottom() + offset + 0.01;
                    break;
                }
                // collision to the block when falling down
                else if(velocityY >= 0){
                    velocityY = 0;
                    const offset = currentBox.getBottom() - y;
                    y = collisionBBs[i].getTop() - offset - 0.01;
                    break;
                }
            };
        };

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
        update: update,
        getId,
        getwithtreasure: getwithtreasure,
        droptreasure: droptreasure
    };
};
