console.log("registration.js loaded");

const Registration = (function() {
    // This function sends a register request to the server
    // * `username`  - The username for the sign-in
    // * `onSuccess` - This is a callback function to be called when the
    //                 request is successful in this form `onSuccess()`
    const register = function(username, onSuccess) {
        console.log("Registration.register called with username:", username);

        //
        // A. Preparing the user data
        //
        const userData = {"username": username};
 
        //
        // B. Sending the AJAX request to the server
        //
        console.log("Sending register request...");
        fetch("/enterDungeon", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(userData)
        })
        .then((res) => {
            console.log("Response received:", res.status);
            return res.json();
        })

        //
        // J. Handling the success response from the server
        //
        .then((json) => {
            console.log("JSON response:", json);
            if (json.status == "success") {
                console.log("Registration successful, calling onSuccess callback");
                onSuccess();
            } else {
                console.log("Registration failed, status:", json.status);
            }
        })
        .catch((error) => {
            console.error("Registration error:", error);
        });
    };

    return { register };
})();
