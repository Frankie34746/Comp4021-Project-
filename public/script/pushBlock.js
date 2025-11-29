// This function defines the PushBlock module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the block (Top-Left)
// - `y` - The initial y position of the block (Top-Left)
// - `width` - Width in tiles (32px each)
// - `height` - Height in tiles (32px each)
// - `map` - The game map for collision detection
const pushblock = function(ctx, x, y, width, height, gameArea, map) {
    
    const TILE_SIZE = 32;
    const blockWidth = width * TILE_SIZE - 1;
    const blockHeight = height * TILE_SIZE - 1;
    
    // Physics variables
    let posX = x;
    let posY = y;
    const GRAVITY_ACCEL = 1500; // Same as player
    let velocityY = 0;
    
    // Collision boxes from map
    let mapCollisionBBs = map.getBoundingBoxlist();
    
    // Helper: Create bounding box for this pushblock
    const getBoundingBox = function() {
        return BoundingBox(ctx, posY, posX, posY + blockHeight, posX + blockWidth);
    };
    
    // Update physics (gravity and falling)
    const update = function(time, gameArea, pushblocks = []) {
        // Apply gravity
        velocityY += GRAVITY_ACCEL / 60;
        let nextY = posY + velocityY / 60;
        
        // Test vertical movement
        let testBox = BoundingBox(ctx, nextY, posX, nextY + blockHeight, posX + blockWidth);
        
        let collisionDetected = false;

        // Check map collision
        for (let cb of mapCollisionBBs) {
            if (testBox.intersect(cb)) {
                if (velocityY >= 0) { // Falling, land on top
                    posY = cb.getTop() - blockHeight - 0.01;
                } else { // Rising, bounce off bottom
                    posY = cb.getBottom() + 0.01;
                }
                velocityY = 0;
                collisionDetected = true;
                break;
            }
        }

        // Check other pushblocks (for stacking/falling on them)
        if (!collisionDetected) {
            for (let otherBlock of pushblocks) {
                if (otherBlock !== this) {
                    const otherBox = otherBlock.getBoundingBox();
                    if (testBox.intersect(otherBox)) {
                        if (velocityY >= 0) { // Falling, land on top
                            posY = otherBox.getTop() - blockHeight - 0.01;
                        } else { // Rising, bounce off bottom
                            posY = otherBox.getBottom() + 0.01;
                        }
                        velocityY = 0;
                        collisionDetected = true;
                        break;
                    }
                }
            }
        }

        // If no collision, move freely
        if (!collisionDetected) {
            posY = nextY;
        }
        
        // Clamp to game area bounds vertically
        if (posY > gameArea.getBottom()) { 
            posY = gameArea.getBottom();
            velocityY = 0;
        }
        if (posY < gameArea.getTop()) {
            posY = gameArea.getTop();
            velocityY = 0;
        }
        // Horizontal pushing handled externally by players
    };
    
    // Try to push horizontally (called by players)
    const tryPush = function(pushDirection, pushForce, pushblocks) {
        let nextX = posX;
        if (pushDirection === 1) { // Left
            nextX -= pushForce;
        } else if (pushDirection === 3) { // Right
            nextX += pushForce;
        }
        
        // Test horizontal movement
        let testBox = BoundingBox(ctx, posY, nextX, posY + blockHeight, nextX + blockWidth);
        
        // Check map collision
        for (let cb of mapCollisionBBs) {
            if (testBox.intersect(cb)) {
                return false; // Blocked by map
            }
        }
        
        // Check other pushblocks
        for (let otherBlock of pushblocks) {
            if (otherBlock !== this) {
                const otherBox = otherBlock.getBoundingBox();
                if (testBox.intersect(otherBox)) {
                    return false; // Blocked by another pushblock
                }
            }
        }
        
        // Check game area
        if (nextX < gameArea.getLeft() || nextX + blockWidth > gameArea.getRight()) {
            return false;
        }
        
        // Safe to push
        posX = nextX;
        return true;
    };
    
    // Draw the pushblock (simple gray rectangle for now)
    const draw = function() {
        ctx.fillStyle = '#8B4513'; // Brown/wood color
        ctx.fillRect(posX, posY, blockWidth, blockHeight);
        
        // Optional: Outline for visibility
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(posX, posY, blockWidth, blockHeight);
        
        // Optional: Debug bounding box
        // const bb = getBoundingBox();
        // ctx.strokeStyle = 'red';
        // ctx.strokeRect(bb.getLeft(), bb.getTop(), bb.getWidth(), bb.getHeight());
    };
    
    return {
        getBoundingBox: getBoundingBox,
        update: update,
        tryPush: tryPush,
        draw: draw,
        getXY: () => ({ x: posX, y: posY }),
        setXY: (newX, newY) => { posX = newX; posY = newY; }
    };
};
