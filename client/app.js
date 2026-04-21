const API_BASE = 'http://localhost:5000';
let currentlyEditingId = null;

function getAuthHeaders() {
    let headers = { "Content-Type": "application/x-www-form-urlencoded" };
    let sessionID = localStorage.getItem("sessionID");
    if (sessionID) {
        headers["Authorization"] = `Bearer ${sessionID}`;
    }
    return headers;
}

function build_book_div(book) {
    let grid_div = document.querySelector("#book_grid")
    let new_div = document.createElement("div")
    let div_header = document.createElement("h1")
    let p_id = document.createElement("p")
    let p_author = document.createElement("p")
    let p_year = document.createElement("p")
    let p_rating = document.createElement("p")
    let image = document.createElement("img")
    let p_genre = document.createElement("p")
    let btn_edit = document.createElement("button")
    let btn_delete = document.createElement("button")

    image.src = "book.webp";
    image.alt = book.title + " cover"
    image.className = "book-image"

    div_header.innerHTML = book.title
    p_id.innerHTML = `ID: ${book.id || 'n/a'}`
    p_id.className = 'book-id'
    p_author.innerHTML = `Author: ${book.author}`
    p_author.className = 'book-author'
    p_year.innerHTML = `Year: ${book.year_published}`
    p_year.className = 'book-year'
    p_rating.innerHTML = `Rating: ${book.rating}`
    p_rating.className = 'book-rating'
    p_genre.innerHTML = `Genre: ${book.genre}`
    p_genre.className = 'book-genre'

    btn_edit.textContent = "Edit"
    btn_edit.className = "card-button"
    btn_edit.onclick = function () {
        if (!book.id) {
            alert('Cannot edit: book has no ID. Please restart the server if this persists.');
            return;
        }
        currentlyEditingId = book.id
        document.querySelector('#book_title').value = book.title
        document.querySelector('#book_author').value = book.author
        document.querySelector('#book_year_published').value = book.year_published
        document.querySelector('#book_rating').value = book.rating
        document.querySelector('#book_genre').value = book.genre
        document.querySelector('#book_id').value = book.id
        document.querySelector('#book_id').readOnly = true
        document.querySelector('#add_btn').textContent = 'Save'
        modal.classList.add('show')
    }

    btn_delete.textContent = "Delete"
    btn_delete.className = "card-button delete-button"
    btn_delete.onclick = function () {
        if (!book.id) {
            alert('Cannot delete: book has no ID.');
            return;
        }
        if (confirm(`Delete '${book.title}'?`)) {
            fetch(`${API_BASE}/books/${book.id}`, { 
                method: 'DELETE', 
                mode: 'cors',
                headers: getAuthHeaders()
            })
                .then(response => {
                    if (response.status === 204) {
                        load_page();
                        return;
                    }
                    return parseErrorResponse(response);
                })
                .catch(err => {
                    console.error('Delete failed', err);
                    alert('Delete failed: ' + err.message + '. Ensure server is running at http://localhost:5000 and CORS is enabled.');
                });
        }
    }

    grid_div.appendChild(new_div)
    new_div.appendChild(image)
    let textCol = document.createElement('div')
    textCol.appendChild(div_header)
    textCol.appendChild(p_id)
    textCol.appendChild(p_author)
    textCol.appendChild(p_year)
    textCol.appendChild(p_rating)
    textCol.appendChild(p_genre)
    textCol.appendChild(btn_edit)
    textCol.appendChild(btn_delete)
    new_div.appendChild(textCol)
}

function parseErrorResponse(response) {
    return response.text().then(text => {
        let errorObj = {error: response.statusText || 'Unknown error'};
        try {
            const parsed = JSON.parse(text);
            if (parsed && parsed.error) errorObj = parsed;
        } catch (e) {
            if (text) errorObj.error = text;
        }
        throw new Error(errorObj.error || `HTTP ${response.status}`);
    });
}



const modalAddBtn = document.querySelector("#add_btn")
modalAddBtn.onclick = function () {
    console.log("Clicked the button")
    let title = document.querySelector("#book_title").value
    let author = document.querySelector("#book_author").value
    let year_published = document.querySelector("#book_year_published").value
    let rating = document.querySelector("#book_rating").value
    let genre = document.querySelector("#book_genre").value
    let id = document.querySelector("#book_id").value

    console.log(title, author, year_published, rating, genre, id)
    let data = "title=" + encodeURIComponent(title)
    data += "&author=" + encodeURIComponent(author)
    data += "&year_published=" + encodeURIComponent(year_published)
    data += "&rating=" + encodeURIComponent(rating)
    data += "&genre=" + encodeURIComponent(genre)
    data += "&id=" + encodeURIComponent(id)

    const method = currentlyEditingId ? 'PUT' : 'POST';
    const url = currentlyEditingId ? `${API_BASE}/books/${currentlyEditingId}` : `${API_BASE}/books`;

    console.log("The query string is ", data)
    fetch(url, {
        method: method,
        body: data,
        headers: getAuthHeaders()
    }).then(function (response) {
        if (!response.ok && response.status !== 204) {
            return parseErrorResponse(response);
        }
        if (response.status === 201) {
            return response.json();
        }
        return null;
    }).then(function (createdBook) {
        if (createdBook && createdBook.id) {
            console.log('Created book with id', createdBook.id);
        } else if (currentlyEditingId) {
            console.log('Updated book', currentlyEditingId);
        }

        currentlyEditingId = null;
        document.querySelector('#add_btn').textContent = 'Add';
        load_page();
        modal.classList.remove('show');
        document.getElementById('book_form').reset();
        document.getElementById('book_id').readOnly = false;
    }).catch(function (error) {
        alert(error.message)
    })
}

// Modal functionality
const modal = document.getElementById('book_modal');
const addBtn = document.getElementById('add_book_btn');
const cancelBtn = document.getElementById('cancel_btn');

addBtn.addEventListener('click', function () {
    document.getElementById('book_id').readOnly = false;
    modal.classList.add('show');
});

cancelBtn.addEventListener('click', function () {
    modal.classList.remove('show');
    document.getElementById('book_form').reset();
    document.getElementById('book_id').readOnly = false;
});

// Close modal when clicking outside of it
window.addEventListener('click', function (event) {
    if (event.target === modal) {
        modal.classList.remove('show');
        document.getElementById('book_form').reset();
    }
});

// Auth & Settings Logic
const loginModal = document.getElementById('login_modal');
const registerModal = document.getElementById('register_modal');
const appContainer = document.getElementById('app_container');
const loggedOutUI = document.getElementById('logged_out_ui');
const loggedInUI = document.getElementById('logged_in_ui');

// Listeners for open/close auth modals
document.getElementById('nav_login_btn').onclick = () => loginModal.classList.add('show');
document.getElementById('nav_register_btn').onclick = () => registerModal.classList.add('show');
document.getElementById('login_cancel_btn').onclick = () => { loginModal.classList.remove('show'); document.getElementById('login_form').reset(); };
document.getElementById('reg_cancel_btn').onclick = () => { registerModal.classList.remove('show'); document.getElementById('register_form').reset(); };

// Register
document.getElementById('reg_submit_btn').onclick = function() {
    let first_name = document.getElementById('reg_first_name').value;
    let last_name = document.getElementById('reg_last_name').value;
    let email = document.getElementById('reg_email').value;
    let password = document.getElementById('reg_password').value;

    let data = `first_name=${encodeURIComponent(first_name)}&last_name=${encodeURIComponent(last_name)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    
    fetch(`${API_BASE}/users`, {
        method: 'POST',
        body: data,
        headers: getAuthHeaders()
    }).then(res => res.json().then(data => ({status: res.status, body: data})))
    .then(result => {
        if (result.status === 201) {
            alert("Registration successful! You may now login.");
            registerModal.classList.remove('show');
            document.getElementById('register_form').reset();
        } else {
            alert(result.body.error || "Registration failed");
        }
    });
};

// Login
document.getElementById('login_submit_btn').onclick = function() {
    let email = document.getElementById('login_email').value;
    let password = document.getElementById('login_password').value;

    let data = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    
    fetch(`${API_BASE}/login`, {
        method: 'POST',
        body: data,
        headers: getAuthHeaders()
    }).then(res => res.json().then(data => ({status: res.status, body: data})))
    .then(result => {
        if (result.status === 200) {
            loginModal.classList.remove('show');
            document.getElementById('login_form').reset();
            showLoggedInUI(result.body.first_name);
            load_page();
        } else {
            alert(result.body.error || "Login failed");
        }
    });
};

// Logout
document.getElementById('nav_logout_btn').onclick = function() {
    fetch(`${API_BASE}/sessions`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    }).then(() => {
        showLoggedOutUI();
        document.getElementById('book_grid').innerHTML = "";
    });
};

// Color Picker Setting
const colorPicker = document.getElementById('colorPicker');
if (colorPicker) {
    colorPicker.addEventListener('change', function() {
        document.body.style.backgroundColor = this.value;
        let data = `color=${encodeURIComponent(this.value)}`;
        fetch(`${API_BASE}/sessions/settings`, {
            method: 'PUT',
            body: data,
            headers: getAuthHeaders()
        });
    });
}

function showLoggedInUI(name) {
    appContainer.classList.remove('hidden');
    loggedOutUI.classList.add('hidden');
    loggedInUI.classList.remove('hidden');
    if (name) {
        document.getElementById('welcome_message').textContent = `Welcome, ${name}!`;
    }
}

function showLoggedOutUI() {
    appContainer.classList.add('hidden');
    loggedInUI.classList.add('hidden');
    loggedOutUI.classList.remove('hidden');
}

// Session Initialization
function initSession() {
    fetch(`${API_BASE}/sessions`, {
        headers: getAuthHeaders()
    }).then(res => res.json()).then(session => {
        localStorage.setItem('sessionID', session.id);
        
        if (session.data.fav_color) {
            document.body.style.backgroundColor = session.data.fav_color;
            let picker = document.getElementById('color_picker');
            if(picker) picker.value = session.data.fav_color;
        }
        
        if (session.data.email) {
            showLoggedInUI(session.data.first_name);
            load_page();
        } else {
            showLoggedOutUI();
        }
    });
}

// Color setup mapping correctly since id might vary
document.getElementById('color_picker').addEventListener('change', function() {
    document.body.style.backgroundColor = this.value;
    let data = `color=${encodeURIComponent(this.value)}`;
    fetch(`${API_BASE}/sessions/settings`, {
        method: 'PUT',
        body: data,
        headers: getAuthHeaders()
    });
});

initSession();

let allBooks = [];

function load_page(filter = '') {
    let grid_div = document.querySelector("#book_grid")
    grid_div.innerHTML = ""
    console.log("connected")
    
    fetch(`${API_BASE}/books`, {
        headers: getAuthHeaders()
    })
        .then(function (response) {
            console.log('GET /books status', response.status)
            if (response.status === 401) throw new Error("Unauthorized");
            return response.json();
        })
        .then(function (data) {
            console.log('received books count', Array.isArray(data) ? data.length : typeof data, data)
            allBooks = data;
            display_books(filter);
        })
        .catch(function (err) {
            console.error('load_page failed', err)
            const noData = document.createElement('p')
            noData.textContent = 'Failed to load books. Check server and network console.'
            noData.style.textAlign = 'center'
            noData.style.color = 'red'
            grid_div.appendChild(noData)
        })
}

function display_books(filter = '', sortBy = 'none') {
    let grid_div = document.querySelector("#book_grid")
    grid_div.innerHTML = ""

    if (!Array.isArray(allBooks)) {
        console.error('Expected allBooks to be array; got', allBooks)
        return
    }

    const normalizedFilter = (filter || '').toString().toLowerCase()

    let filteredBooks = allBooks.filter(book => {
        const title = (book && book.title) ? book.title.toString().toLowerCase() : ''
        const author = (book && book.author) ? book.author.toString().toLowerCase() : ''
        return title.includes(normalizedFilter) || author.includes(normalizedFilter)
    })

    if (sortBy && sortBy !== 'none') {
        filteredBooks.sort((a, b) => {
            const aVal = a && a[sortBy] != null ? a[sortBy] : ''
            const bVal = b && b[sortBy] != null ? b[sortBy] : ''

            if (sortBy === 'year' || sortBy === 'rating') {
                return Number(bVal) - Number(aVal)
            } else {
                return aVal.toString().localeCompare(bVal.toString())
            }
        })
    }

    if (filteredBooks.length === 0) {
        const noData = document.createElement('p')
        noData.textContent = 'No books found.'
        noData.style.textAlign = 'center'
        noData.style.color = '#444'
        grid_div.appendChild(noData)
        return
    }

    filteredBooks.forEach(function (book) {
        if (!book || !book.title || !book.author) {
            console.warn('Skipping malformed book:', book)
            return
        }
        build_book_div(book)
    })
}

load_page()

// Search functionality
const searchInput = document.getElementById('search_input');
searchInput.addEventListener('input', function() {
    const sortValue = document.getElementById('sort_select').value;
    display_books(this.value, sortValue);
});

// Sort functionality
const sortSelect = document.getElementById('sort_select');
sortSelect.addEventListener('change', function() {
    const filterValue = document.getElementById('search_input').value;
    display_books(filterValue, this.value);
});