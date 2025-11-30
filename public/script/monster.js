const Monster = function(ctx, x, y, gameArea, map, withtreasure = false) {
    // Deterministic ID based on starting position
    const id = `m_${Math.floor(x)}_${Math.floor(y)}`;

    const sprite_height = 64;
    const sprite_width = 64;
    let maxhp = Math.floor(Math.random() * 3) + 1;
    let hp = maxhp;
    let lastHitTime = 0;
    const HIT_COOLDOWN = 300;  // 300ms cooldown between hits
    let knockbackEndTime = 0;
    const KNOCKBACK_DURATION = 300; // ms
    const KNOCKBACK_HORIZONTAL = 300; // pixels/sec
    const KNOCKBACK_VERTICAL = -600; // pixels/sec upward
    const FRICTION = 1000; // pixels/sec^2

    const takeDamage = function(time, facing) {
        if (time - lastHitTime > HIT_COOLDOWN) {
            hp--;
            lastHitTime = time;
            knockbackEndTime = time + KNOCKBACK_DURATION;
            // Knockback direction same as player's facing (push away from player)
            const knockbackDir = (facing === 3 ? 1 : -1); // if facing 3 (right), positive (right), else negative (left)
            velocityX = knockbackDir * KNOCKBACK_HORIZONTAL;
            velocityY = KNOCKBACK_VERTICAL;
            return true;
        }
        return false;
    };
    // Collision boxes of maps
    let collisionBBs = map.getBoundingBoxlist();

    // This is the sprite sequences of the monster facing different directions.
    // Assuming similar layout to player for simplicity; adjust as needed for actual spritesheet.
    const sequences = {
        /* Moving sprite sequences for facing different directions */
        moveLeft:  { x: 0, y: sprite_height * 9, width: sprite_width, height: sprite_height, count: 8, timing: 50, loop: true },
        moveRight: { x: 0, y: sprite_height * 11, width: sprite_width, height: sprite_height, count: 8, timing: 50, loop: true },
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
          .useSheet("res/monster-spritesheet.png");

    // Speed
    let speed = 50; // Speed for walking (pixels per second)

    // --- Physics Variables ---
    const GRAVITY_ACCEL = 1500; // Gravity acceleration (pixels/sec^2)
    let velocityY = 0; // Current vertical velocity (pixels/sec)
    let velocityX = 0; // Current horizontal velocity (pixels/sec)

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
            // Random color for dropped treasure
            const colors = ["green", "red", "yellow", "purple"];
            const randomColor = colors[Math.floor(Math.random() * 4)];
            return treasure(context, x, y, randomColor);
        }
    }

    // Getter for current HP
    const getHp = function() {
        return hp;
    };

    // Getter for max HP (optional, if you need it elsewhere)
    const getMaxHp = function() {
        return maxhp;
    };

    // This function updates the monster.
    // - `time` - The timestamp when this function is called
    const update = function(time) {
        let { x, y } = sprite.getXY();

        // Handle horizontal velocity
        if (time < knockbackEndTime) {
            // During knockback, apply friction
            if (velocityX > 0) {
                velocityX -= FRICTION / 60;
                if (velocityX < 0) velocityX = 0;
            } else if (velocityX < 0) {
                velocityX += FRICTION / 60;
                if (velocityX > 0) velocityX = 0;
            }
        } else {
            // Normal walking
            velocityX = (direction === 3 ? speed : -speed);
        }

        // Move horizontally
        x += velocityX / 60;

        // Keep monster within bounds horizontally and reverse direction if not in knockback
        if (x < gameArea.getLeft()) {
            x = gameArea.getLeft();
            if (time >= knockbackEndTime) direction = 3;
            velocityX = 0;
            if (direction !== prevDirection) {
                sprite.setSequence(direction === 1 ? sequences.moveLeft : sequences.moveRight);
                prevDirection = direction;
            }
        }
        if (x > gameArea.getRight()) {
            x = gameArea.getRight();
            if (time >= knockbackEndTime) direction = 1;
            velocityX = 0;
            if (direction !== prevDirection) {
                sprite.setSequence(direction === 1 ? sequences.moveLeft : sequences.moveRight);
                prevDirection = direction;
            }
        }

        let halfWidth = sprite_width / 2;
        let halfheight = sprite_height / 2;
        let left = x - halfWidth / 2;
        let right = x + halfWidth / 2;
        let top = y - halfheight;
        let bottom = y + sprite_height;
        let currentBox = BoundingBox(ctx, top, left, bottom, right);

        for (let i = 0; i < collisionBBs.length; i++) {
            if (currentBox.intersect(collisionBBs[i])){
                // collision to the block when moving to the left
                if (velocityX < 0) {
                    const offset = x - currentBox.getLeft();
                    x = collisionBBs[i].getRight() + offset + 0.01;
                    if (time >= knockbackEndTime) direction = 3;
                    velocityX = 0;
                    if (direction !== prevDirection) {
                        sprite.setSequence(direction === 1 ? sequences.moveLeft : sequences.moveRight);
                        prevDirection = direction;
                    }
                    break;
                }
                // collision to the block when moving to the right
                else if (velocityX > 0){
                    const offset = currentBox.getRight() - x;
                    x = collisionBBs[i].getLeft() - offset - 0.01;
                    if (time >= knockbackEndTime) direction = 1;
                    velocityX = 0;
                    if (direction !== prevDirection) {
                        sprite.setSequence(direction === 1 ? sequences.moveLeft : sequences.moveRight);
                        prevDirection = direction;
                    }
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

        left = x - halfWidth / 2;
        right = x + halfWidth / 2;
        top = y - halfheight;
        bottom = y + sprite_height;
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

        // Update direction and sequence based on current velocityX only when not in knockback
        if (time >= knockbackEndTime) {
            if (velocityX > 0 && direction !== 3) {
                direction = 3;
                sprite.setSequence(sequences.moveRight);
                prevDirection = 3;
            } else if (velocityX < 0 && direction !== 1) {
                direction = 1;
                sprite.setSequence(sequences.moveLeft);
                prevDirection = 1;
            }
        }

        /* Update the sprite object */
        sprite.update(time);
    };

    // The methods are returned as an object here.
    return {
        getHp,
        getMaxHp,
        takeDamage,
        getBoundingBox: getBoundingBox,
        draw: sprite.draw,
        update: update,
        getId,
        getwithtreasure: getwithtreasure,
        droptreasure: droptreasure,
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        getDirection: () => direction,
        setDirection: (dir) => { direction = dir; prevDirection = dir; }
    };
};
