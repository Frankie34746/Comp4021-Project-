// This function defines the Player module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the player
// - `y` - The initial y position of the player
// - `gameArea` - The bounding box of the game area
const Player = function(ctx, x, y, gameArea, map) {

    const attackframe = 50;
    const attackcount = 6;

    const sprite_height = 64;
    const sprite_width = 64;
    

    const halfWidth = sprite_width / 2;
    const halfheight = sprite_height / 2;

    // Collision boxes of maps
    let collisionBBs = map.getBoundingBoxlist();

    // This is the sprite sequences of the player facing different directions.
    const sequences = {
        /* Idling sprite sequences for facing different directions */
        idleLeft:  { x: 0, y: 1471, width: sprite_width, height: sprite_height, count: 2, timing: 500, loop: true },
        idleRight: { x: 0, y: 1599, width: sprite_width, height: sprite_height, count: 2, timing: 500, loop: true },

        /* Moving sprite sequences for facing different directions */
        moveLeft:  { x: 0, y: 576, width: sprite_width, height: sprite_height, count: 8, timing: 50, loop: true },
        moveRight: { x: 0, y: 703, width: sprite_width, height: sprite_height, count: 8, timing: 50, loop: true },

        attackLeft: { x: 0, y: 3583, width: 128, height: 128, count: attackcount, timing: attackframe, loop: false },
        attackRight: { x: 0, y: 3839, width: 128, height: 128, count: attackcount, timing: attackframe, loop: false },

        /* Fall/ Death sprite sequences */
        fallLeft: { x: 0, y: 1280, width: sprite_width, height: sprite_height, count: 6, timing: 100, loop: false },
        fallRight: { x: 0, y: 1343, width: sprite_width, height: sprite_height, count: 6, timing: 100, loop: false }
    };

    // This is the sprite object of the player created from the Sprite module.
    const sprite = Sprite(ctx, x, y);

    // The sprite object is configured for the player sprite here.
    sprite.setSequence(sequences.idleLeft)
          .setScale(2)
          .setShadowScale({ x: 0.75, y: 0.20 })
          .useSheet("res/character-spritesheet.png");

    // This is the moving direction: 0=not moving, 1=Left, 2=Up (unused for physics), 3=Right, 4=Down (unused for physics)
    let direction = 0;
    let facing = 1;

    // --- Physics Variables for Running and Jumping ---
    let speed = 150; // Horizontal moving speed (pixels per second)
    const JUMP_STRENGTH = 650; // Initial upward vertical velocity (pixels/sec)
    const GRAVITY_ACCEL = 1500; // Gravity acceleration (pixels/sec^2)
    let velocityY = 0; // Current vertical velocity (pixels/sec)
    let isJumping = false;
    let isattacking = false;
    let isDead = false;

    // Player HP
    let hp = 3;
    const maxHP = 3;

    // Hurt cooldown
    let lastHurtTime = 0;
    const HURT_COOLDOWN = 3000; // 3 seconds in ms
    let isInvulnerable = false;

    // Get function for HP
    const getHP = function() {
        return hp;
    };

    // Set function for HP
    const setHP = function(newHP) {
        const wasAlive = hp > 0;
        const isAliveNow = newHP > 0;
        hp = newHP;
        
        // Trigger death animation
        if (wasAlive && !isAliveNow) {
            isDead = true;
            const deathSequence = (facing === 1) ? sequences.fallLeft : sequences.fallRight;
            sprite.setSequence(deathSequence);
        }
        // Revival - return to idle
        else if (!wasAlive && isAliveNow) {
            isDead = false;
            const idleSequence = (facing === 1) ? sequences.idleLeft : sequences.idleRight;
            sprite.setSequence(idleSequence);
        }
    }

    // Function to hurt the player with cooldown
    const hurt = function(now) {
        if (now - lastHurtTime > HURT_COOLDOWN && hp > 0) {
            hp--;
            lastHurtTime = now;
            isInvulnerable = true;
            console.log("Player hurt! HP:", hp);
            
            // Trigger death animation if HP reaches 0
            if (hp <= 0) {
                isDead = true;
                const deathSequence = (facing === 1) ? sequences.fallLeft : sequences.fallRight;
                sprite.setSequence(deathSequence);
            }
            
            return true;  // Indicate HP changed
        }
        return false;
    };

    // Check if player is in invulnerable state
    const getIsInvulnerable = function(now) {
        if (isInvulnerable && now - lastHurtTime > HURT_COOLDOWN) {
            isInvulnerable = false;
        }
        return isInvulnerable;
    };
        
    // get function for isAttacking
    const isAttacking = function(){
        return isattacking;
    };

    // Get attack bounding box (front half during attack) as BoundingBox object
    const getAttackBoundingBox = function() {
        let { x, y } = sprite.getXY();
        if (facing === 1) { // Left
            left = x-halfWidth-sprite_width;
            right = x-halfWidth;
        } else { // Right
            left = x+halfWidth
            right = x+halfWidth+sprite_width;
        }
        let top = y-halfheight;
        let bottom = y+sprite_height;
        // Assuming BoundingBox takes ctx, top, left, bottom, right 
        return BoundingBox(ctx, top, left, bottom, right);
    };

    const getBoundingBox = function() {
        let { x, y } = sprite.getXY();

        let left = x-halfWidth / 2;
        let right = x+halfWidth / 2;
        let top = y-halfheight;
        let bottom = y+sprite_height;

        // Assuming BoundingBox takes ctx, top, left, bottom, right 
        return BoundingBox(ctx, top, left, bottom, right);
    };

    // This function sets the player's moving direction.
    // - `dir` - the moving direction (1: Left, 2: Up, 3: Right, 4: Down)
    const move = function(dir) {
        if (hp <= 0) return; // Cannot move when dead
        if (dir >= 1 && dir <= 4 && dir != direction ) {
            switch (dir) {
                case 1: sprite.setSequence(sequences.moveLeft); break;
                case 3: sprite.setSequence(sequences.moveRight); break;
            }
            direction = dir;
            facing = dir;
        }
    };

    // This function stops the player from moving horizontally.
    // - `dir` - the moving direction when the player is stopped (1: Left, 3: Right)
    // This function stops the player from moving.
    // - `dir` - the moving direction when the player is stopped (1: Left, 2: Up, 3: Right, 4: Down)
    const stop = function(dir) {
        if (direction == dir ) {
            switch (dir) {
                case 0: switch(facing){
                    case 1: sprite.setSequence(sequences.idleLeft); break;
                    case 3: sprite.setSequence(sequences.idleRight); break;
                }break;
                case 1: sprite.setSequence(sequences.idleLeft); break;
                case 3: sprite.setSequence(sequences.idleRight); break;
            }
            direction = 0;
        }
    };

    // This function initiates the player's jump.
    const jump = function() {
        if (hp <= 0) return; // Cannot jump when dead
        if (!isJumping){
            velocityY = -JUMP_STRENGTH;
            isJumping = true;
        }
    };

    // This function initiates the player's Attack
    const attack = function() {
        if (hp <= 0) return; // Cannot attack when dead
        if (!isattacking && !isJumping){
            isattacking = true;
            setTimeout(() => {
                stop(direction);
                isattacking = false;
            }, attackframe*attackcount);
            switch (facing) {
                case 1: sprite.setSequence(sequences.attackLeft); break;
                case 3: sprite.setSequence(sequences.attackRight); break;
            }
        }
    };

    // This function speeds up the player.
    const speedUp = function() {
        if (hp <= 0) return; // Cannot speed up when dead
        speed = 250;
    };

    // This function slows down the player.
    const slowDown = function() {
        if (hp <= 0) return; // Cannot slow down when dead
        speed = 150;
    };

    // This function updates the player depending on his movement.
    // - `time` - The timestamp when this function is called
    const update = function(time) {
        let { x, y } = sprite.getXY();

        // Stop movement if HP is 0 and maintain death animation
        if (hp <= 0) {
            direction = 0;
            velocityY = Math.min(velocityY, 0); // Allow falling but not jumping
            
            // Ensure death animation stays active
            if (isDead) {
                const deathSequence = (facing === 1) ? sequences.fallLeft : sequences.fallRight;
                if (sprite.getSequence() !== deathSequence) {
                    sprite.setSequence(deathSequence);
                }
            }
        }

        // Update the player if not attacking
        if (!isattacking) {
            /* Horizontal Movement */
            if (direction != 0) {
                switch (direction) {
                    case 1: x -= speed / 60; break;
                    case 3: x += speed / 60; break;
                }
            }

            // Keep player within bounds horizontally
            if (x < gameArea.getLeft()) {
                x = gameArea.getLeft();
            }
            if (x > gameArea.getRight()) {
                x = gameArea.getRight();
            }

            let left = x-halfWidth / 2;
            let right = x+halfWidth / 2;
            let top = y-halfheight;
            let bottom = y+sprite_height;
            let currentBox = BoundingBox(ctx, top, left, bottom, right);

            // 1. Check map collision
            for (let i = 0; i < collisionBBs.length; i++) {
                if (currentBox.intersect(collisionBBs[i])){
                    // collision to the block when moving to the left
                    if (direction === 1) {
                        const offset = x - currentBox.getLeft();
                        x = collisionBBs[i].getRight() + offset + 0.01;
                        break;
                    }
                    // collision to the block when moving to the right
                    else if (direction === 3){
                        const offset = currentBox.getRight() - x;
                        x = collisionBBs[i].getLeft() - offset - 0.01;
                        break;
                    }
                }
            }

            // 3. Check pushblock collision and try to push
            for (let block of pushblocks) {
                const blockBox = block.getBoundingBox();
                if (currentBox.intersect(blockBox)) {
                    // Only try to push if player is moving into the block
                    if (direction === 1 || direction === 3) {
                        const pushSuccess = block.tryPush(direction, speed / 60, pushblocks);
                        if (!pushSuccess) {
                            // Cannot push → stop player
                            if (direction === 1) {
                                const offset = x - currentBox.getLeft();
                                x = blockBox.getRight() + offset + 0.01;
                            } else if (direction === 3) {
                                const offset = currentBox.getRight() - x;
                                x = blockBox.getLeft() - offset - 0.01;
                            }
                        }
                        // If push succeeded, player keeps moving → no break needed
                    }
                    break;
                }
            }
        }

        // Vertical Physics (Gravity and Jump) - applies whether attacking or not
        velocityY += GRAVITY_ACCEL / 60;
        y += velocityY / 60;

        // Check if hit the ground
        if (y > gameArea.getBottom()) {
            velocityY = 0;
            y = gameArea.getBottom();
            isJumping = false;
        }


        let left = x-halfWidth / 2;
        let right = x+halfWidth / 2;
        let top = y-halfheight;
        let bottom = y+sprite_height;
        let currentBox = BoundingBox(ctx, top, left, bottom, right);

        // Map vertical collision
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
                    isJumping = false;
                    const offset = currentBox.getBottom() - y;
                    y = collisionBBs[i].getTop() - offset - 0.01;
                    break;
                }
            }
        }

        // Other players vertical collision (can stand on them)
        for (let other of players) {
            if (other !== this) {
                const otherBox = other.getBoundingBox();
                if (currentBox.intersect(otherBox)) {
                    if (velocityY > 0) {
                        velocityY = 0;
                        isJumping = false;
                        const offset = currentBox.getBottom() - y;
                        y = otherBox.getTop() - offset - 0.01;
                    }
                    break;
                }
            }
        }

        // Pushblock vertical collision (player can stand on them)
        for (let block of pushblocks) {
            const blockBox = block.getBoundingBox();
            if (currentBox.intersect(blockBox)) {
                if (velocityY < 0) {
                    velocityY = 0;
                    const offset = y - currentBox.getTop();
                    y = blockBox.getBottom() + offset + 0.01;
                } else if (velocityY >= 0) {
                    velocityY = 0;
                    isJumping = false;
                    const offset = currentBox.getBottom() - y;
                    y = blockBox.getTop() - offset - 0.01;
                }
                break;
            }
        }

        // Keep player within bounds vertically
        if (y < gameArea.getTop()) {
            y = gameArea.getTop();
            velocityY = 0;
        }

        // === GROUND DETECTION (allow jumping only when on ground) ===
        let onGround = false;

        left = x - halfWidth/2 + 10;
        right = x + halfWidth/2 - 10;
        top = y;
        bottom = y + sprite_height + 1;
        const groundCheckBox = BoundingBox(ctx, top, left, bottom, right);

        for (let i = 0; i < collisionBBs.length; i++) {
            if (groundCheckBox.intersect(collisionBBs[i])){
                onGround = true;
                break;
            }
        }

        for (let other of players) {
            if (other !== this) {
                if (groundCheckBox.intersect(other.getBoundingBox())) {
                    onGround = true;
                    break;
                }
            }
        }

        for (let block of pushblocks) {
            if (groundCheckBox.intersect(block.getBoundingBox())) {
                onGround = true;
                break;
            }
        }

        // Also count gameArea bottom as ground
        if (y + 1 >= gameArea.getBottom() - 1) {
            onGround = true;
        }
        // Now update isJumping flag properly
        if (onGround) {
            isJumping = false;  // Allow jump again
        }
        else{
            isJumping = true; // Disable jump
        }

        sprite.setXY(x, y);
        
        // Update the sprite animation
        sprite.update(time);
    };

    // The methods are returned as an object here.
    return {
        move: move,
        stop: stop,
        jump: jump, 
        attack: attack,
        speedUp: speedUp,
        slowDown: slowDown,
        isAttacking: isAttacking,
        getHP: getHP,
        setHP,
        hurt: hurt,
        getIsInvulnerable: getIsInvulnerable,
        getAttackBoundingBox: getAttackBoundingBox,
        getBoundingBox: getBoundingBox,
        draw: sprite.draw,
        update: update
    };
};
