const myLibrary = [];

function Book(title, author, pages, isRead) {
  this.title = title;
  this.author = author;
  this.pages = pages;
  this.isRead = Boolean(isRead);
  this.id = crypto.randomUUID();
  this.info = function () {
    const readStatus = this.isRead ? "is read" : "not read yet";
    return `"${this.title}" by ${this.author}, ${this.pages} pages, ${readStatus}.`;
  };
}

function addBookToLibrary(title, author, pages, isRead) {
  const newBook = new Book(title, author, pages, isRead);
  myLibrary.push(newBook);

  return newBook;
}

function displayBook() {
  console.log(`\n--- My Library (${myLibrary.length} books) ---`);

  myLibrary.forEach((book) => {
    console.log(`ID: ${book.id}`);
    console.log(book.info());
  });
}


