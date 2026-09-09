class Book {
  constructor(title, author, pages, isRead, cover) {
    this.title = title;
    this.author = author;
    this.pages = pages;
    this.isRead = Boolean(isRead);
    this.cover = cover || null;
    this.id = crypto.randomUUID();
  }

  getInfo() {
    const readStatus = this.isRead ? "is read" : "not read yet";
    return `"${this.title}" by ${this.author}, ${this.pages} pages, ${readStatus}.`;
  }

  toggleRead() {
    this.isRead = !this.isRead;
    return this.isRead;
  }

  releaseCover() {
    if (this.cover && this.cover.startsWith("blob:")) {
      URL.revokeObjectURL(this.cover);
      this.cover = null;
    }
  }
}

class Library {
  constructor() {
    this.books = [];
  }

  addBook(title, author, pages, isRead, cover) {
    const newBook = new Book(title, author, pages, isRead, cover);
    this.books.push(newBook);
    return newBook;
  }

  deleteBook(id) {
    const index = this.books.findIndex((book) => book.id === id);
    if (index !== -1) {
      this.books[index].releaseCover();
      this.books.splice(index, 1);
      return true;
    }
    return false;
  }

  findBook(id) {
    return this.books.find((book) => book.id === id);
  }

  getBooks() {
    return this.books;
  }
}

class UI {
  constructor(library) {
    this.library = library;
    this.pendingCoverUrl = null;

    this.libraryContent = document.querySelector(".library-content");
    this.addBookBtn = document.getElementById("add-book-btn");
    this.modal = document.getElementById("book-modal");
    this.bookForm = document.getElementById("book-form");
    this.closeModalBtn = document.getElementById("close-modal");
    this.coverInput = document.getElementById("cover");
    this.coverPreview = document.getElementById("cover-preview");

    this.setupEventListeners();
  }

  static escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  static coverInitial(title) {
    const first = Array.from(title.trim())[0];
    return this.escapeHtml(first ? first.toUpperCase() : "?");
  }

  clearPendingCover() {
    if (this.pendingCoverUrl) {
      URL.revokeObjectURL(this.pendingCoverUrl);
      this.pendingCoverUrl = null;
    }
    this.coverPreview.removeAttribute("src");
    this.coverPreview.hidden = true;
  }

  render() {
    this.libraryContent.innerHTML = "";
    const books = this.library.getBooks();

    if (books.length === 0) {
      this.libraryContent.innerHTML =
        '<p class="empty-state">No books yet. Add one above!</p>';
      return;
    }

    books.forEach((book) => {
      const card = document.createElement("article");
      card.className = "book-card";
      card.dataset.id = book.id;

      const coverHtml = book.cover
        ? `<img class="cover-img" src="${UI.escapeHtml(book.cover)}" alt="Cover of ${UI.escapeHtml(book.title)}">`
        : `<span class="cover-placeholder" aria-hidden="true">${UI.coverInitial(book.title)}</span>`;

      card.innerHTML = `
        <div class="book-cover">${coverHtml}</div>
        <div class="book-info">
          <h3 class="book-title">${UI.escapeHtml(book.title)}</h3>
          <p class="book-author">${UI.escapeHtml(book.author)}</p>
          <p class="book-pages">${book.pages} pages</p>
        </div>
        <div class="book-actions">
          <button type="button" class="read-toggle ${book.isRead ? "is-read" : ""}" data-id="${book.id}" aria-pressed="${book.isRead}" aria-label="Mark &quot;${UI.escapeHtml(book.title)}&quot; as ${book.isRead ? "not read" : "read"}">
            <span class="toggle-track"><span class="toggle-knob"></span></span>
            <span class="status-label">${book.isRead ? "Read" : "Not Read"}</span>
          </button>
          <button class="btn-delete" type="button" data-id="${book.id}" aria-label="Delete &quot;${UI.escapeHtml(book.title)}&quot;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete
          </button>
        </div>`;

      this.libraryContent.appendChild(card);
    });
  }

  // event listeners
  setupEventListeners() {
    this.addBookBtn.addEventListener("click", () => this.modal.showModal());
    this.closeModalBtn.addEventListener("click", () => this.modal.close());
    this.modal.addEventListener("close", () => {
      this.bookForm.reset();
      this.clearPendingCover();
    });

    // Cover preview
    this.coverInput.addEventListener("change", () => {
      const file = this.coverInput.files[0];
      if (this.pendingCoverUrl) {
        URL.revokeObjectURL(this.pendingCoverUrl);
        this.pendingCoverUrl = null;
      }
      if (!file) {
        this.coverPreview.removeAttribute("src");
        this.coverPreview.hidden = true;
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please choose an image file.");
        this.coverInput.value = "";
        this.coverPreview.hidden = true;
        return;
      }
      this.pendingCoverUrl = URL.createObjectURL(file);
      this.coverPreview.src = this.pendingCoverUrl;
      this.coverPreview.hidden = false;
    });

    // form submission
    this.bookForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("title").value.trim();
      const author = document.getElementById("author").value.trim();
      const pages = parseInt(document.getElementById("pages").value, 10);
      const isRead = document.getElementById("is-read").checked;

      if (!title || !author || Number.isNaN(pages)) {
        alert("Please fill in all fields correctly.");
        return;
      }

      const cover = this.pendingCoverUrl;
      this.pendingCoverUrl = null; // Reset after use

      this.library.addBook(title, author, pages, isRead, cover);
      this.render();
      this.modal.close();
    });

    // delegated events
    this.libraryContent.addEventListener("click", (e) => {
      const toggleBtn = e.target.closest(".read-toggle");
      if (toggleBtn) {
        const book = this.library.findBook(toggleBtn.dataset.id);
        if (book) {
          book.toggleRead();
          this.render();
        }
        return;
      }

      const deleteBtn = e.target.closest(".btn-delete");
      if (deleteBtn) {
        this.library.deleteBook(deleteBtn.dataset.id);
        this.render();
      }
    });
  }
}

const myLibrary = new Library();
const appUI = new UI(myLibrary);

// dummy books
myLibrary.addBook("Breaking Bad", "Vince Gilligan", 1000, true, "img/bb.jpg");
myLibrary.addBook("1984", "George Orwell", 328, true, "img/1984.png");
myLibrary.addBook(
  "Better Call Saul",
  "Vince Gilligan",
  1000,
  true,
  "img/bcs.jpg",
);
myLibrary.addBook(
  "El Camino: A Breaking Bad Movie",
  "Vince Gilligan",
  1000,
  true,
  "img/jesse-pinkman.jpg",
);
myLibrary.addBook(
  "Attack on Titan",
  "Hajime Isayama",
  203,
  true,
  "img/aot.jpg",
);
myLibrary.addBook(
  "The Rick and Morty Book One Deluxe Edition",
  "Zac Gorman",
  296,
  true,
  "img/r&m.jpg",
);

// initial render
appUI.render();
