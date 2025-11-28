// This function defines the Player module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the player
// - `y` - The initial y position of the player
// - `gameArea` - The bounding box of the game area
const Player = function(ctx, x, y, gameArea) {

    const attackframe = 50;
    const attackcount = 6;

    const sprite_height = 64;
    const sprite_width = 64;
    
    // This is the sprite sequences of the player facing different directions.
    const sequences = {
        /* Idling sprite sequences for facing different directions */
        idleLeft:  { x: 0, y: 1471, width: sprite_width, height: sprite_height, count: 2, timing: 500, loop: true },
        idleRight: { x: 0, y: 1599, width: sprite_width, height: sprite_height, count: 2, timing: 500, loop: true },

        /* Moving sprite sequences for facing different directions */
        moveLeft:  { x: 0, y: 576, width: sprite_width, height: sprite_height, count: 8, timing: 50, loop: true },
        moveRight: { x: 0, y: 703, width: sprite_width, height: sprite_height, count: 8, timing: 50, loop: true },

        attackLeft: { x: 0, y: 3583, width: 128, height: 128, count: attackcount, timing: attackframe, loop: false },
        attackRight: { x: 0, y: 3839, width: 128, height: 128, count: attackcount, timing: attackframe, loop: false }
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

    // Player HP
    let hp = 3;
    const maxHP = 3;

    // Hurt cooldown
    let lastHurtTime = 0;
    const HURT_COOLDOWN = 1000; // 1 second in ms

    // Get function for HP
    const getHP = function() {
        return hp;
    };

    // Function to hurt the player with cooldown
    const hurt = function(now) {
        if (now - lastHurtTime > HURT_COOLDOWN && hp > 0) {
            hp--;
            lastHurtTime = now;
            console.log(hp);
        }
    };
    
    // get function for isAttacking
    const isAttacking = function(){
        return isattacking;
    };

    // Get attack bounding box (front half during attack) as BoundingBox object
    const getAttackBoundingBox = function() {
        let { x, y } = sprite.getXY();
        let halfWidth = sprite_width / 2;
        let halfheight = sprite_height / 2;
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
    
    // This function sets the player's moving direction.
    // - `dir` - the moving direction (1: Left, 2: Up, 3: Right, 4: Down)
    const move = function(dir) {
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
        if (!isJumping){
            velocityY = -JUMP_STRENGTH;
            isJumping = true;
        }
    };

    // This function initiates the player's Attack
    const attack = function() {
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
        speed = 250;
    };

    // This function slows down the player.
    const slowDown = function() {
        speed = 150;
    };

    // This function updates the player depending on his movement.
    // - `time` - The timestamp when this function is called
    const update = function(time) {
        let { x, y } = sprite.getXY();
        
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

        // Keep player within bounds vertically
        if (y < gameArea.getTop()) {
            y = gameArea.getTop();
            velocityY = 0;
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
        hurt: hurt,
        getAttackBoundingBox: getAttackBoundingBox,
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: update
    };
};

