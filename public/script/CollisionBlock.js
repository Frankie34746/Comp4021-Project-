// This function defines the CollisionBlock module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the block
// - `y` - The initial y position of the block
// - (x,y) is the Top-Left point of the block
const CollisionBlock = function(ctx, x, y) {
    const width = 32;
    const height = 32;

    const getBoundingBox = function() {
        /* Find the box coordinates */
        const top = y;
        const left = x;
        const bottom = y + width;
        const right = x + height;

        return BoundingBox(ctx, top, left, bottom, right);
    };

    const draw = function() {
        context.strokeStyle = 'red';
        context.lineWidth = 2;
        ctx.strokeRect(x, y, 32, 32)
    }
    return{
        draw: draw,
        getBoundingBox: getBoundingBox
    };
};
