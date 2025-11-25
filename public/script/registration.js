const Registration = (function() {
    // This function sends a register request to the server
    // * `username`  - The username for the sign-in
    // * `onSuccess` - This is a callback function to be called when the
    //                 request is successful in this form `onSuccess()`
    const register = function(username, onSuccess) {

        //
        // A. Preparing the user data
        //
        const userData = {"username": username};
 
        //
        // B. Sending the AJAX request to the server
        //
        fetch("/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(userData)
        })
        .then((res) => res.json() )

        //
        // J. Handling the success response from the server
        //
        .then((json) => {
            if (json.status == "success") {
                onSuccess();
            }
        })
    };

    return { register };
})();
