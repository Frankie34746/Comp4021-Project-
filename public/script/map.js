const map = function(ctx, collisions, background) {
    
    let CollisionBlocks = [];
    const tileSize = 32;
    const mapWidth = 40; // Number of columns in the map grid

    for (let i = 0; i < collisions.length; i++) {
        if (collisions[i] !== 0) {
            const tileX = (i % mapWidth) * tileSize;
            const tileY = Math.floor(i / mapWidth) * tileSize;
            const block = CollisionBlock(ctx, tileX, tileY);
            CollisionBlocks.push(block);
        }
    }

    const draw = function (){
        if (background && background.complete && background.naturalWidth > 0) {
            ctx.drawImage(
                background,
                0, 0,                    // top-left corner on canvas
                mapWidth * tileSize,     // width of the map in pixels
                Math.ceil(collisions.length / mapWidth) * tileSize  // height of the map
            );
        }
        //CollisionBlocks.forEach(block => block.draw());
    }

    const getBoundingBoxlist = function(){
        return CollisionBlocks.map(block => block.getBoundingBox());
    }

    return{
        draw: draw,
        getBoundingBoxlist: getBoundingBoxlist
    };
};
