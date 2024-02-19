'use strict'
const BOOKS_DB = 'booksDB'
_createBooks()

var gBooks
var gFilterBy = ''

function getBooks(options) {
    const books = _filterBooks(options.filterBy)

    if (options.sortBy.title) {
        books.sort((book1, book2) => (book1.title.localeCompare(book2.title)) * options.sortBy.title)
    }
    else if (options.sortBy.rating) {
        books.sort((book1, book2) => (book1.rating - book2.rating) * options.sortBy.rating)
    }
    else if (options.sortBy.price) {
        books.sort((book1, book2) => (book1.price - book2.price) * options.sortBy.price)
    }

    const startIdx = options.page.idx * options.page.size
    return books.slice(startIdx, startIdx + options.page.size)
}

function getTotalPageCount(options) {
    const books = _filterBooks(options.filterBy)
    return Math.ceil(books.length / options.page.size)
}

function getBook(bookId) {
    return gBooks.find(book => book.id === bookId)
}

function getBookStats() {
    return {
        total: gBooks.length,
        expansive: gBooks.filter(book => book.price > 200).length,
        average: gBooks.filter(book => book.price > 80 && book.price < 200).length,
        cheap: gBooks.filter(book => book.price < 80).length
    }
}

function removeBook(bookId) {
    const bookIdx = gBooks.findIndex(book => book.id === bookId)
    if (bookIdx === -1) return
    gBooks.splice(bookIdx, 1)
    _saveBooks()
}

function updateBook(bookId, title, rating, price) {
    const book = getBook(bookId)
    book.title = title
    book.rating = rating
    book.price = price
    _saveBooks()
    return book
}

function addBook(title, rating, price) {
    gBooks.push({
        id: makeId(),
        title,
        price,
        imgUrl: `${getRandomIntInclusive(1, 3)}.jpg`,
        rating
    })
    _saveBooks()
}

function setFilterBy(filterBy) {
    gFilterBy = filterBy.toLowerCase()
}

function _createBooks() {
    gBooks = loadFromStorage(BOOKS_DB)

    if (!gBooks) {
        gBooks = [
            _createBook('The Book Thief', 120, 'the_book_thief.jpg', 5),
            _createBook('Fall of Giants', 250, 'Fall_of_Giants.jpg', 5),
            _createBook('Solitaire', 90, 'solitaire.jpg', 5),
            _createBook('The Time Traveler\'s Wife', 170, 'the_time_travelers_wife.jpg', 4),
        ]
        _saveBooks()
    }
}

function _createBook(title, price, imgUrl, rating) {
    return {
        id: makeId(),
        title,
        price,
        imgUrl: imgUrl || `${getRandomIntInclusive(1, 3)}.jpg`,
        rating: rating || getRandomIntInclusive(1, 5)
    }
}

function _saveBooks() {
    saveToStorage(BOOKS_DB, gBooks)
}

function _filterBooks(filterBy) {
    return gBooks.filter(book => book.title.toLowerCase().includes(filterBy.txt)
        && book.rating >= filterBy.minRating)
}