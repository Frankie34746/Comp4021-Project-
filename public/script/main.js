// main.js
$(function() {
        const cv = $("canvas").get(0);
        const context = cv.getContext("2d");

    const gameArea = BoundingBox(context, 165, 60, 420, 800);

    const player = Player(context, 427, 240, gameArea); // The player

    setupInputListeners(player);

    function doFrame(now) {
    /* Process the next frame */
    player.update(now);
    context.clearRect(0, 0, cv.width, cv.height);
    player.draw();

    requestAnimationFrame(doFrame);
    }

    requestAnimationFrame(doFrame);
});
