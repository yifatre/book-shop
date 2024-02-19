'use strict'
const gQueryOptions = {
    filterBy: { txt: '', minRating: 0 },
    sortBy: {},
    page: { idx: 0, size: 6 }
}
var gBookToEdit = null

function onInit() {
    readQueryParams()
    render()
}

function render() {
    const books = getBooks(gQueryOptions)
    const displayPref = loadFromStorage('display-pref')
    if (displayPref === 'list') {
        document.querySelector('section.books').innerHTML = ''
        var booksHTMLStr = `
        <table class="books">
        <tr>
        <th>Title</th>
        <th>Rating</th>
        <th>Price</th>
        <th>Actions</th>
        </tr>`
        if (!books.length) return document.querySelector('table.books').innerHTML = booksHTMLStr + '<tr><td colspan="4" >No matching books found</tr></td>'
        const booksHTML = books.map((book) =>
            `<tr>
            <td>${book.title}</td>
            <td>${'⭐'.repeat(book.rating) || 'No Rating Yet'}</td>
            <td>${book.price}</td>
            <td>
                <button onclick="onReadBook('${book.id}')">Read</button>
                <button onclick="onUpdateBook('${book.id}')">Update</button>
                <button onclick="onRemoveBook('${book.id}')">Delete</button>
            </td>
        </tr>`
        )
        booksHTMLStr += `${booksHTML.join('')}</table>`
        document.querySelector('table.books').innerHTML = booksHTMLStr
    }
    else {
        document.querySelector('table.books').innerHTML = ''
        const elGridContainer = document.querySelector('section.books')
        var strHTML = books.map(book =>
            `<div class="item">
            <h4>${book.title}</h4>
            <span class="rating">Rating: ${book.rating}</span>
            <span class="price">Price: ${book.price}</span>
            <img src="img/${book.imgUrl}" alt="${book.title} cover">
            </div>`
        )
        elGridContainer.innerHTML = strHTML.join('')
    }
    renderStats()
    setQueryParams()
}

function renderStats() {
    const stats = getBookStats()
    const elFooter = document.querySelector('footer')
    elFooter.querySelector('.total').innerText = stats.total
    elFooter.querySelector('.expansive').innerText = stats.expansive
    elFooter.querySelector('.average').innerText = stats.average
    elFooter.querySelector('.cheap').innerText = stats.cheap
}

function onRemoveBook(bookId) {
    const bookTitle = getBook(bookId).title
    removeBook(bookId)
    render()
    const elMsg = document.querySelector('.msg')
    elMsg.querySelector('h3 span').innerText = `${bookTitle} has been deleted`
    elMsg.show()
    setTimeout(() => elMsg.close(), 2000);
}

function onUpdateBook(bookId) {
    gBookToEdit = getBook(bookId)

    const elModal = document.querySelector('.book-edit-modal')

    const elHeading = elModal.querySelector('h2')
    const elTitleInput = elModal.querySelector('.title-input')
    const elRatingInput = elModal.querySelector('.rating-input')
    const elPriceInput = elModal.querySelector('.price-input')

    elHeading.innerText = 'Edit Book'
    elTitleInput.value = gBookToEdit.title
    elRatingInput.value = gBookToEdit.rating
    elPriceInput.value = gBookToEdit.price

    elModal.showModal()
}

function onAddBook() {
    const elModal = document.querySelector('.book-edit-modal')
    const elHeading = elModal.querySelector('h2')

    elHeading.innerText = 'Add Book'
    elModal.showModal()
}

function onSaveBook(ev) {
    // ev.preventDefault()
    const elTitleInput = document.querySelector('.book-edit-modal .title-input')
    const elRatingInput = document.querySelector('.book-edit-modal .rating-input')
    const elPriceInput = document.querySelector('.book-edit-modal .price-input')

    if (!elTitleInput.value) return
    if (!elRatingInput.value) return
    if (!elPriceInput.value) return

    const bookTitle = elTitleInput.value
    const rating = +elRatingInput.value
    const price = +elPriceInput.value


    const elMsg = document.querySelector('.msg')
    if (gBookToEdit) {
        var book = updateBook(gBookToEdit.id, bookTitle, rating, price)
        gBookToEdit = null
        elMsg.querySelector('h3 span').innerText = `${bookTitle} has been updated`
    } else {
        var book = addBook(bookTitle, rating, price)
        elMsg.querySelector('h3 span').innerText = `${bookTitle} has been added`
    }
    render()

    elMsg.show()
    setTimeout(() => elMsg.close(), 2000);
}

function onCloseBookEdit() {
    document.querySelector('.book-edit-modal form').reset()
    document.querySelector('.book-edit-modal').close()
}

function onReadBook(bookId) {
    const book = getBook(bookId)
    const elModal = document.querySelector('.book-details')
    elModal.querySelector('h2 span').innerText = `${book.title}`
    elModal.querySelector('pre').innerText = `Rating: ${book.rating}\nPrice: ${book.price}₪`//JSON.stringify(book, null, 2)
    elModal.querySelector('.cover').innerHTML = `<img src="img/${book.imgUrl}" alt="${book.title} cover">`
    elModal.show()
}

function onInputFilter(elSearchInput) {
    // setFilterBy(elSearchInput.value)
    gQueryOptions.filterBy.txt = elSearchInput.value
    render()
}

function onSelectRatingChange(elRating) {
    gQueryOptions.filterBy.minRating = elRating.value
    render()
}

function onClearSearch(ev) {
    ev.preventDefault()
    document.querySelector('.filter-input').value = ''
    document.querySelector('select').value = ''
    gQueryOptions.filterBy.txt = ''
    gQueryOptions.filterBy.minRating = 0
    render()
}

function onSetSortBy() {
    const elSortBy = document.querySelector('.sort-by select')
    const elDir = document.querySelector('.sort-by input:checked')

    gQueryOptions.sortBy = {}
    gQueryOptions.sortBy[elSortBy.value] = elDir.value

    gQueryOptions.page.idx = 0
    render()
}

function onListClick() {
    saveToStorage('display-pref', 'list')
    render()
}

function onCardsClick() {
    saveToStorage('display-pref', 'cards')
    render()
}

function onNextPage() {
    const totalPageCount = getTotalPageCount(gQueryOptions)

    if (gQueryOptions.page.idx < totalPageCount - 1) {
        gQueryOptions.page.idx++
    } else {
        gQueryOptions.page.idx = 0
    }
    render()
}

function onPrevPage() {
    const totalPageCount = getTotalPageCount(gQueryOptions)

    if (gQueryOptions.page.idx > 0) {
        gQueryOptions.page.idx--
    } else {
        gQueryOptions.page.idx = totalPageCount - 1
    }
    render()
}

function readQueryParams() {
    const queryParams = new URLSearchParams(window.location.search)
    gQueryOptions.filterBy = {
        txt: queryParams.get('title') || '',
        minRating: +queryParams.get('minRating') || 0
    }

    if (queryParams.get('sortBy')) {
        const prop = queryParams.get('sortBy')
        const dir = +queryParams.get('sortDir')
        gQueryOptions.sortBy[prop] = dir
    }

    if (queryParams.get('pageIdx')) {
        gQueryOptions.page.idx = +queryParams.get('pageIdx')
        // gQueryOptions.page.size = +queryParams.get('pageSize')
    }
    renderQueryParams()
}

function renderQueryParams() {

    document.querySelector('.filter-input').value = gQueryOptions.filterBy.txt
    document.querySelector('.filter select').value = gQueryOptions.filterBy.minRating || ''

    const sortKeys = Object.keys(gQueryOptions.sortBy)
    const sortBy = sortKeys[0]
    const dir = gQueryOptions.sortBy[sortKeys[0]]

    document.querySelector('.sort-by select').value = sortBy || ''
    if (dir === 1) document.querySelector('.sort-by #ascending').checked = true
    else document.querySelector('.sort-by #descending').checked = true
}

function setQueryParams() {
    const queryParams = new URLSearchParams()

    queryParams.set('title', gQueryOptions.filterBy.txt)
    queryParams.set('minRating', gQueryOptions.filterBy.minRating)

    const sortKeys = Object.keys(gQueryOptions.sortBy)
    if (sortKeys.length) {
        queryParams.set('sortBy', sortKeys[0])
        queryParams.set('sortDir', gQueryOptions.sortBy[sortKeys[0]])
    }

    if (gQueryOptions.page) {
        queryParams.set('pageIdx', gQueryOptions.page.idx)
        queryParams.set('pageSize', gQueryOptions.page.size)
    }

    const newUrl =
        window.location.protocol + "//" +
        window.location.host +
        window.location.pathname + '?' + queryParams.toString()

    window.history.pushState({ path: newUrl }, '', newUrl)
}