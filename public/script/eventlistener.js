/**
 * Sets up keydown and keyup event listeners to control the player.
 * @param {object} player - The player object with move, stop, speedUp, and slowDown methods.
 */
function setupInputListeners(player) {
    // Keydown handler
        const A = 65;
        const W= 87;
        const D = 68;
        const SPACEBAR = 32;
        const J = 74;

    $(document).on("keydown", function(event) {
        // Arrow keys and Spacebar key codes
        
        // This is a common pattern to prevent default browser actions (like scrolling)
        // when arrow keys or spacebar are pressed.

        if (!player.isAttacking()){

        // if (event.keyCode >= LEFT_ARROW && event.keyCode <= DOWN_ARROW || event.keyCode === SPACEBAR) {
        //     event.preventDefault();
        // }

        switch (event.keyCode) {
            case A:
                player.move(1); // Assuming 1 is left
                break;
            case W:
                player.jump(); // Assuming 2 is up
                break;
            case D:
                player.move(3); // Assuming 3 is right
                break;
            case SPACEBAR:
                player.speedUp();
                break;
            case J:
                player.attack();
                break;
            default:
                console.log(event.keyCode)
                break;
        }
    }
    });

    // Keyup handler
    $(document).on("keyup", function(event) {


        if (!player.isAttacking()){
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
    }
    });
}
