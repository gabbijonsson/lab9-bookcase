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
    let viewBooksBtn = document.querySelector('#viewButton')
    let bookContainer = document.querySelector('.bookshelf_books_container');
    let errorContainer = document.querySelector('.error_list_container');
    let successBox = document.querySelector('#successbox');

    successBox.checked = false;

    addBookSubmitButton.addEventListener('click', addBook);
    viewBooksBtn.addEventListener('click', fetchBookSelection)
    successBox.addEventListener('change', () => {addPlease = successBox.checked});

    /**
     * Sends GET-request. Used for every GET-request with different query parameters and responshandlers
     * @param {string} queries - A query string that is appended to the API-URL.
     * @param {function} handleResponse - A callback function to handle the response from the API.
     * @param {number} requestCount - The number of requests that have been made in the current sequence. Default value is 1. This parameter should not be provided when invoking the function.
     */
    const sendRequest = (queries, handleResponse, requestCount = 1) => {
        if (addPlease) {
            queries += '&please';
        }
        const xhr = new XMLHttpRequest();
        // Send GET-request with base-url and the queries specified by parameter
        xhr.open('GET', apiUrl + queries);
        xhr.onload = function () {
            let response = JSON.parse(this.responseText);
            if (this.status == 200 && response.status == 'success') {
                // Invoke the responsehandler specified by parameter, send parsed responsetext as argument to responsehandler.
                handleResponse(response);
            }
            else {
                // Invoke errorBuilder with the errormessage, number of requests made and the query sent in the request. Invoke sendRequest recursively if requestCount is less than 5.
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
        // Handle response when generating new API-keys. Invoke fetchBookSelection to display bookselection of current user.
        const responseHandlerKey = (response) => {
            userApiKey = response.key;
            console.log('Saving new key in local storage. Key: ' + userApiKey)
            localStorage.setItem("storedApiKey", userApiKey)
            fetchBookSelection();
        }
        sendRequest('?requestKey', responseHandlerKey);
    }

    // Create the div to hold the bookcontent. Append bookinfo and bookbuttons.
    function createBook(data) {    
        let book = document.createElement('div');
        book.id = data.id;
        book.className = 'bookshelf_book';      
        book.appendChild(createBookInfoContainer(data.author, data.title, data.updated));
        book.appendChild(createBookButtons(data.id));
        return book;
    }

    // Create the unorderedlist to hold author, title and changedata.
    function createBookInfoContainer(authorData, titleData, updatedData) {
        let bookInfoList = document.createElement('ul');
        bookInfoList.className = 'bookshelf_book-info';
        bookInfoList.appendChild(createBookInfo(authorData, 'bookshelf_book-author nobreak'));
        bookInfoList.appendChild(createBookInfo(titleData, 'bookshelf_book-title nobreak'));
        bookInfoList.appendChild(createBookInfo(updatedData, 'bookshelf_book-changed nobreak'));
        return bookInfoList;
    }

    // Create the li-elements to hold the value.
    function createBookInfo(data, classname) {
        let bookInfo = document.createElement('li');
        bookInfo.className = classname;
        bookInfo.innerHTML = data;
        return bookInfo;
    }

    // Create the unorderedlist to hold edit- and deletebuttons.
    function createBookButtons(bookId) {
        let bookshelfBookButtons = document.createElement('ul');
        bookshelfBookButtons.className = 'bookshelf_book-buttons';
        bookshelfBookButtons.appendChild(createButton('EDIT', 'bookshelf_book-edit', editBook, bookId));
        bookshelfBookButtons.appendChild(createButton('DELETE', 'bookshelf_book-delete', removeBook, bookId));
        return bookshelfBookButtons;
    }

    /**
     * Creates the li-elements to hold the buttons. Creates the button-elements and append to the li-elements.
     * @param {String} buttontext - Text that will be displayed on the button.
     * @param {String} classname - Classname of new li-element. Should always be 'bookshelf_book-edit' or 'bookshelf_book-delete'.
     * @param {Function} listenerType - The function that will be invoked by the eventlistener. Should always be editBook or removeBook.
     * @param {Number} bookId - ID  of the book that the buttons will belong to.
     */
    function createButton(buttontext, classname, listenerType, bookId) {
        let btnContainer = document.createElement('li');
        let btn = document.createElement('button');
        let btnClass = classname + 'btn';
        btnContainer.className = classname;
        btn.setAttribute('bookKey', bookId);
        btn.className = btnClass;
        btn.innerHTML = buttontext;
        btn.addEventListener('click', listenerType);
        btnContainer.appendChild(btn);
        return btnContainer;
    }

    // Invoke fetchBookSelection and enable add-button
    function addBookResponseHandler() {
        fetchBookSelection();
        addBookSubmitButton.disabled = false;
    }

    // Disable add-button and compile query. Invoke sendRequest with query.
    function addBook() {
        addBookSubmitButton.disabled = true;
        let newBookTitle = '&title=' + addBookTitle.value;
        let newBookAuthor = '&author=' + addBookAuthor.value;
        let addQuery = '?op=insert&key=' + userApiKey + newBookTitle + newBookAuthor;
        sendRequest(addQuery, addBookResponseHandler);
    }

    // Invoke createBook with a bookobject. Append the book-element created in createBook to the bookContainer-element
    function appendBook(bookData) {
        bookContainer.appendChild(createBook(bookData));
    }

    // Clear the current list of books. Take response from sendRequest and iterate through the array of books, send each book to appendBook-function.
    function fetchBookResponseHandler(responseObject) {
        while(bookContainer.hasChildNodes()) {
            bookContainer.removeChild(bookContainer.firstChild)
        }
        responseObject.data.forEach(appendBook);
    }

    // Compile query to fetch current users bookcollection. Invoke sendRequest with compiled query.
    function fetchBookSelection() {
        let fetchQuery = '?op=select&key=' + userApiKey;
        sendRequest(fetchQuery, fetchBookResponseHandler);
    }

    // Compile query to delete book. Send request with compiled query.
    function removeBook(event) {
        console.log('Delete button pushed!');
        let buttonID = event.currentTarget.getAttribute('bookkey');
        console.log('Buttonkey: ' + buttonID);
        let deleteQuery = '?op=delete&key=' + userApiKey + '&id=' + buttonID;
        sendRequest(deleteQuery, fetchBookSelection);
    }

    // Change edit-related values and elements. 
    function editBook(event) {
        console.log('Edit button pushed!');
        let buttonID = event.currentTarget.getAttribute('bookkey')
        let bookInfoContainer = document.getElementById(buttonID).querySelector('.bookshelf_book-info');
        event.currentTarget.removeEventListener('click', editBook);

        // Change buttontext to SAVE
        event.currentTarget.innerHTML = 'SAVE';
        event.currentTarget.addEventListener('click', saveEditedBook);

        // Create variables to be used for saving current value of elements.
        let authorElement = document.getElementById(buttonID).querySelector('.bookshelf_book-author');
        let titleElement = document.getElementById(buttonID).querySelector('.bookshelf_book-title');
        let updateElement = document.getElementById(buttonID).querySelector('.bookshelf_book-changed');

        // Save current value of elements from previous book
        let authorOldText = authorElement.innerHTML;
        let titleOldText = titleElement.innerHTML;

        // Remove li-elements containing outdated book-info
        removeBookInfo(authorElement, titleElement, updateElement);

        // Append new input-fields built in buildEditInputElements
        bookInfoContainer.appendChild(createEditInputElement('Author', authorOldText));
        bookInfoContainer.appendChild(createEditInputElement('Title', titleOldText));
    }

    // Remove elements related to edited book.
    function removeBookInfo(author, title,  update) {
        author.remove();
        title.remove();
        update.remove();
    }

    // Create input-element for editing bookinfo
    function createEditInputElement(inputCategory, oldText) {
        let newInputElem = document.createElement('input');
        newInputElem.placeholder = oldText;
        newInputElem.value = oldText;
        newInputElem.setAttribute('required', '');
        newInputElem.className = 'new' + inputCategory;
        return newInputElem;
    }
    
    // Save changes made to book into variables. Compile query for editing book. If new variables have a value, invoke sendRequest with compiled query.
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
        // Activate add-button after 5 failed requests.
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