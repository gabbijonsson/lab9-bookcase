const apiUrl = 'https://www.forverkliga.se/JavaScript/api/crud.php'
let userApiKey = '';
let addPlease = false;

window.addEventListener('load', () => {
    console.log('Window loaded..')
    /**
     * Event-listeners and queryselectors
     */

    let addBookSubmitButton = document.querySelector('#addBookSubmitBtn');
    let addBookAuthor = document.querySelector('#addBookBookAuthor');
    let addBookTitle = document.querySelector('#addBookBookTitle');
    let bookContainer = document.querySelector('.bookshelf_books_container');
    let errorContainer = document.querySelector('.error_list_container');
    let successBox = document.querySelector('#successbox');

    successBox.checked = false;
    addBookSubmitButton.addEventListener('click', addBook);
    successBox.addEventListener('change', () => {addPlease = successBox.checked});

    /**
     * Sends GET-request. Used for every GET-request with different query-adds and responshandlers
     * @param {string} queries - A query string that is appended to the API-URL.
     * @param {function} handleResponse - A callback function to handle the response from the API.
     */
    const sendRequest = (queries, handleResponse, requestCount = 1) => {
        if (addPlease) {
            queries += '&please';
        }
        console.log('please is: ' + addPlease);
        
        const xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl + queries);                                      // Send GET-request with base-url and the queries specified by parameter
        xhr.onload = function () {
            let response = JSON.parse(this.responseText);
            if (this.status == 200 && response.status == 'success') {
                handleResponse(response);                              // Initiate the responsehandler specified by parameter, send parsed responsetext as argument to responsehandler.
            }
            // ! This needs to be checked and fixed so that it handles statuscodes other than 200. 
            else {
                errorBuilder(response.message, requestCount, queries);
                if(requestCount < 5) {
                    console.log('Requestcount: ' + requestCount);
                    sendRequest(queries, handleResponse, requestCount+1)
                }
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

    /**
        * Requests a new key if local storage does not have a key.
        * Stores the new key in local storage and sets the value of 
        * userApiKey to the retrieved key.
    */
    userApiKey = loadStoredApiKey();
    if (userApiKey) {
        fetchBookSelection();
    } else {
        console.log('User API-key not found in local storage. Requesting a new API-key.')
        const responseHandlerKey = (response) => {                                          // Function "responsehandler" for generating new API-keys. Take response from xhr.onload as parameter.
            userApiKey = response.key;                                                      // Set newKey-variable to the value of key in response from xhr.onload.
            console.log('Saving new key in local storage. Key: ' + userApiKey)
            localStorage.setItem("storedApiKey", userApiKey)
            fetchBookSelection();
        }
        sendRequest('?requestKey', responseHandlerKey);                                      // Initiate sendRequest-function with query-add requestKey and a responsehandler to handle the response from xhr.onload.
    }

    /**
     * 
     */
    // Create the book
    function createBook(data) {    
        let book = document.createElement('div');
        book.id = data.id;
        book.className = 'bookshelf_book';      
        book.appendChild(createBookInfoContainer(data.author, data.title, data.updated));
        book.appendChild(createBookButtons(data.id));
        return book;
    }

    function createBookInfoContainer(authorData, titleData, updatedData) {
        let bookInfoList = document.createElement('ul');
        bookInfoList.className = 'bookshelf_book-info';
        bookInfoList.appendChild(createBookInfo(authorData, 'bookshelf_book-author nobreak'));
        bookInfoList.appendChild(createBookInfo(titleData, 'bookshelf_book-title nobreak'));
        bookInfoList.appendChild(createBookInfo(updatedData, 'bookshelf_book-changed nobreak'));
        return bookInfoList;
    }

    // Add content to the book
    function createBookInfo(data, classname) {
        let bookInfo = document.createElement('li');
        bookInfo.className = classname;
        bookInfo.innerHTML = data;
        return bookInfo;
    }

    // Create buttons for the book
    function createBookButtons(bookId) {
        let bookshelfBookButtons = document.createElement('ul');
        bookshelfBookButtons.className = 'bookshelf_book-buttons';
        bookshelfBookButtons.appendChild(createButton('EDIT', 'bookshelf_book-edit', editBook, bookId));
        bookshelfBookButtons.appendChild(createButton('DELETE', 'bookshelf_book-delete', removeBook, bookId));
        return bookshelfBookButtons;
    }

    function createButton(buttontext, classname, listenerType, bookId) {
        let btnContainer = document.createElement('li');
        let btn = document.createElement('button');
        let btnClass = classname + 'btn';
        btnContainer.className = (classname);
        btn.setAttribute('bookKey', bookId);
        btn.className = btnClass;
        btn.innerHTML = buttontext;
        btn.addEventListener('click', listenerType);
        btnContainer.appendChild(btn);
        return btnContainer;
    }

    function addBookResponseHandler() {
        fetchBookSelection();
        addBookSubmitButton.disabled = false;
    }

    // Send add-book request to API.
    function addBook() {
        addBookSubmitButton.disabled = true;
        let newBookTitle = '&title=' + addBookTitle.value;
        let newBookAuthor = '&author=' + addBookAuthor.value;
        let addQuery = '?op=insert&key=' + userApiKey + newBookTitle + newBookAuthor;
        sendRequest(addQuery, addBookResponseHandler);
    }

    function appendBook(bookData) {
        bookContainer.appendChild(createBook(bookData));
    }

    // Update book-list with information from the API
    function fetchBookResponseHandler(responseObject) {
        while(bookContainer.hasChildNodes()) {
            bookContainer.removeChild(bookContainer.firstChild)
        }
        responseObject.data.forEach(appendBook);
    }

    function fetchBookSelection() {
        let fetchQuery = '?op=select&key=' + userApiKey;
        sendRequest(fetchQuery, fetchBookResponseHandler);
    }


    function removeBook(event) {
        console.log('Delete button pushed!');
        let buttonID = event.currentTarget.getAttribute('bookkey');
        console.log('Buttonkey: ' + buttonID);
        let deleteQuery = '?op=delete&key=' + userApiKey + '&id=' + buttonID;
        sendRequest(deleteQuery, fetchBookSelection);
    }

    function editBook(event) {
        console.log('Edit button pushed!');
        let buttonID = event.currentTarget.getAttribute('bookkey')
        let bookInfoContainer = document.getElementById(buttonID).querySelector('.bookshelf_book-info');
        event.currentTarget.removeEventListener('click', editBook);

        // Change buttontext to SAVE
        event.currentTarget.innerHTML = 'SAVE';
        event.currentTarget.addEventListener('click', saveEditedBook);

        // Save text-fields from previous book
        let authorElement = document.getElementById(buttonID).querySelector('.bookshelf_book-author');
        let authorOldText = authorElement.innerHTML;
        let titleElement = document.getElementById(buttonID).querySelector('.bookshelf_book-title');
        let titleOldText = titleElement.innerHTML;
        let updateElement = document.getElementById(buttonID).querySelector('.bookshelf_book-changed');

        // Remove li-elements containing outdated book-info
        authorElement.remove();
        titleElement.remove();
        updateElement.remove();

        // Add input-fields for changes
        let newAuthorInput = document.createElement('input');
        newAuthorInput.placeholder = authorOldText;
        newAuthorInput.value = authorOldText;
        newAuthorInput.setAttribute('required', '');
        newAuthorInput.className = 'newAuthor';
        bookInfoContainer.appendChild(newAuthorInput);

        let newTitleInput = document.createElement('input');
        newTitleInput.placeholder = titleOldText;
        newTitleInput.value = titleOldText;
        newTitleInput.setAttribute('required', '');
        newTitleInput.className = 'newTitle';
        bookInfoContainer.appendChild(newTitleInput);
    }
    
    function saveEditedBook(event) {
        let buttonID = event.currentTarget.getAttribute('bookkey')
        let newAuthorValue = document.querySelector('.newAuthor').value;
        console.log(newAuthorValue);
        let newTitleValue = document.querySelector('.newTitle').value;
        console.log(newTitleValue);
        
        let editQuery = `?op=update&key=${userApiKey}&id=${buttonID}&title=${newTitleValue}&author=${newAuthorValue}`;
        if(!newTitleValue || !newAuthorValue) {
            alert('Title and Author are required. Please enter bookinformation and try to save again!')
        } else {
            sendRequest(editQuery, fetchBookSelection);
        }
    }

    function errorBuilder(message, requestCount, queries) {
        console.log('We\'re inside errorBuilder');
        console.log(message);
        if(requestCount == 5) {
            addBookSubmitButton.disabled = false;
        }
                
        // Create the UL for errorinformation
        let newError = document.createElement('ul');
        newError.className = 'error_list_item';
        errorContainer.prepend(newError);

        // Add errorinformation
        let newErrorMsg = document.createElement('li');
        newErrorMsg.className = 'error_list_item-message';
        newErrorMsg.innerHTML = message + ' | On query: ' + queries;
        newError.appendChild(newErrorMsg);

        // Add attemptnumber
        let newAttemptNr = document.createElement('li');
        newAttemptNr.className = 'error_list_item-attemptnumber';
        newAttemptNr.innerHTML = requestCount;
        newError.appendChild(newAttemptNr);

    }
})