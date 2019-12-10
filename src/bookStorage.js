// TODO: !! DESIGN !! Add .toggleClass('show') to .navbar_list on('click') of navbar_img
const apiUrl = 'https://www.forverkliga.se/JavaScript/api/crud.php?'
let userApiKey = '';


/**
 * Sends GET-request. Used for every GET-request with different query-adds and responshandlers
 * @param {string} queries - A query string that is appended to the API-URL.
 * @param {function} handleResponse - A callback function to handle the response from the API.
 */
const sendRequest = (queries, handleResponse) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl + queries);                                                  // Send GET-request with base-url and the queries specified by parameter
    xhr.onload = function() {
        if(this.status == 200) {
            handleResponse(JSON.parse(this.responseText));                              // Initiate the responsehandler specified by parameter, send parsed responsetext as argument to responsehandler.
        }
// ! This needs to be checked and fixed so that it handles statuscodes other than 200. 
        else {
            let errorMsg = JSON.parse(this.responseText);
            console.log(errorMsg.status)
        }
    }
    xhr.send();
}

/**
 * Loads API-key from local storage.
 */
const loadStoredApiKey = () => {
    return localStorage.getItem("storedApiKey");
}

userApiKey = loadStoredApiKey();

/**
    * Requests a new key if local storage does not have a key.
    * Stores the new key in local storage and sets the value of 
    * userApiKey to the retrieved key.
*/
if (!userApiKey) {
    console.log('User API-key not found in local storage. Requesting a new API-key.')
    const responseHandlerKey = (response) => {                                          // Function "responsehandler" for generating new API-keys. Take response from xhr.onload as parameter.
        userApiKey = response.key;                                                      // Set newKey-variable to the value of key in response from xhr.onload.
        console.log('Saving new key in local storage. Key: ' + userApiKey)
        localStorage.setItem("storedApiKey", userApiKey)
    }
    sendRequest('requestKey', responseHandlerKey);                                      // Initiate sendRequest-function with query-add requestKey and a responsehandler to handle the response from xhr.onload.
}

/**
 * 
 */

$('form').on('submit', (event) => {
    event.preventDefault();
    let operationType = 'op=insert';
    // let formData = $('.addBookForm')
    
    console.log(event);

})



// ! EVERYTHING BELOW THIS LINE WILL BE REMOVED BEFORE PRESENTATION AND SUBMIT
/* Test stuff n' thangs with delayed console.log */

const delayedConsoleLog = () => {
    console.log(userApiKey);
}
setTimeout(delayedConsoleLog, 3000);