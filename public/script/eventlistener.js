/**
 * Sets up keydown and keyup event listeners to control the player.
 * @param {object} player - The player object with move, stop, speedUp, and slowDown methods.
 */
function setupInputListeners(player) {
    // Keydown handler
    const A = 65;
    const W = 87;
    const D = 68;
    const SPACEBAR = 32;
    const J = 74;

    $(document).on("keydown", function(event) {
        if (player.isAttacking()) {
            return;
        }

        switch (event.keyCode) {
            case A:
                player.move(1); // Move left
                break;
            case W:
                player.jump(); // Jump
                break;
            case D:
                player.move(3); // Move right
                break;
            case SPACEBAR:
                player.speedUp();
                break;
            case J:
                player.attack();
                break;
            default:
                break;
        }
    });

    // Keyup handler
    $(document).on("keyup", function(event) {
        if (player.isAttacking()) {
            return;
        }

        switch (event.keyCode) {
            case A:
                player.stop(1);
                break;
            case D:
                player.stop(3);
                break;
            case SPACEBAR:
                player.slowDown();
                break;
        }
    });
}
