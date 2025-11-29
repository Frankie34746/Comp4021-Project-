// This function defines the Gem module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the gem
// - `y` - The initial y position of the gem
// - `color` - The colour of the gem
const treasure = function(ctx, x, y, color) {

    const sprite_height = 16;
    const sprite_width = 16;
    
    const halfWidth = sprite_width / 2;
    const halfheight = sprite_height / 2;

    // This is the sprite sequences of the gem of four colours
    // `green`, `red`, `yellow` and `purple`.
    const sequences = {
        green:  { x: 192, y:  0, width: sprite_width, height: sprite_height, count: 4, timing: 200, loop: true },
        red:    { x: 192, y: 16, width: sprite_width, height: sprite_height, count: 4, timing: 200, loop: true },
        yellow: { x: 192, y: 32, width: sprite_width, height: sprite_height, count: 4, timing: 200, loop: true },
        purple: { x: 192, y: 48, width: sprite_width, height: sprite_height, count: 4, timing: 200, loop: true }
    };

    // This is the sprite object of the gem created from the Sprite module.
    const sprite = Sprite(ctx, x, y);

    // The sprite object is configured for the gem sprite here.
    sprite.setSequence(sequences[color])
          .setScale(2)
          .setShadowScale({ x: 0.75, y: 0.2 })
          .useSheet("/res/object_sprites.png");

    // This function sets the color of the gem.
    // - `color` - The colour of the gem which can be
    // `"green"`, `"red"`, `"yellow"` or `"purple"`
    const setColor = function(color) {
        sprite.setSequence(sequences[color]);
        birthTime = performance.now();
    };

    // This function randomizes the gem colour and position.
    // - `area` - The area that the gem should be located in.
    const randomize = function(area) {
        /* Randomize the color */
        const colors = ["green", "red", "yellow", "purple"];
        setColor(colors[Math.floor(Math.random() * 4)]);
    };

    const getBoundingBox = function() {
        let { x, y } = sprite.getXY();

        let left = x-halfWidth;
        let right = x+halfWidth;
        let top = y-halfheight;
        let bottom = y+sprite_height;

        // Assuming BoundingBox takes ctx, top, left, bottom, right 
        return BoundingBox(ctx, top, left, bottom, right);
    };

    // Randomize initially
    randomize(gameArea);

    // The methods are returned as an object here.
    return {
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        setColor: setColor,
        getBoundingBox: getBoundingBox,
        randomize: randomize,
        draw: sprite.draw,
        update: sprite.update
    };
};
