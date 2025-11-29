// This function defines the Player module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the player
// - `y` - The initial y position of the player
const portal = function(ctx, x, y) {
    
    const sprite_width = 92;
    const sprite_height = 112;
    const halfWidth = sprite_width / 2;
    const halfheight = sprite_height / 2;

    let isopen = false;

    // This is the sprite sequences of the player facing different directions.
    const sequences = {
        /* Idling sprite sequences for facing different directions */
        idle:  { x: 0, y: 0, width: sprite_width, height: sprite_height, count: 1, timing: 10, loop: false },

        /* Open door sprite sequences if player is in front */
        opening:  { x: 0, y: 0, width: sprite_width, height: sprite_height, count: 5, timing: 150, loop: false }
    };

    // This is the sprite object of the player created from the Sprite module.
    const sprite = Sprite(ctx, x, y);

    sprite.setSequence(sequences.opening)
          .useSheet("res/doorOpen.png");

    const getBoundingBox = function() {
        let { x, y } = sprite.getXY();

        let left = x-halfWidth;
        let right = x+halfWidth;
        let top = y-halfheight;
        let bottom = y+sprite_height;

        // Assuming BoundingBox takes ctx, top, left, bottom, right 
        return BoundingBox(ctx, top, left, bottom, right);
    };
    

    const update = function(time){
        let isopennow = false;

        if (players) {
            players.forEach(player => {
                if (getBoundingBox().intersect(player.getBoundingBox()))
                    isopennow = true;
            });
        }
        if (!isopennow){
            sprite.setSequence(sequences.idle);}
        else if (!isopen){
            sprite.setSequence(sequences.opening);}
        isopen = isopennow;
        /* Update the sprite object */
        sprite.update(time);
    }

    return{
        isopen,
        draw: sprite.draw,
        getBoundingBox: getBoundingBox,
        update: update
    };
};
