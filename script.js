const myLibrary = [];

function Book(title, author, pages, isRead, cover) {
  this.title = title;
  this.author = author;
  this.pages = pages;
  this.isRead = Boolean(isRead);
  this.cover = cover || null;
  this.id = crypto.randomUUID();
}

Book.prototype.info = function () {
  const readStatus = this.isRead ? "is read" : "not read yet";
  return `"${this.title}" by ${this.author}, ${this.pages} pages, ${readStatus}.`;
};

Book.prototype.toggleRead = function () {
  this.isRead = !this.isRead;
  return this.isRead;
};

Book.prototype.releaseCover = function () {
  if (this.cover) {
    URL.revokeObjectURL(this.cover);
    this.cover = null;
  }
};

function addBookToLibrary(title, author, pages, isRead, cover) {
  const newBook = new Book(title, author, pages, isRead, cover);
  myLibrary.push(newBook);

  return newBook;
}

const libraryContent = document.querySelector(".library-content");
const addBookBtn = document.getElementById("add-book-btn");
const modal = document.getElementById("book-modal");
const bookForm = document.getElementById("book-form");
const closeModalBtn = document.getElementById("close-modal");
const coverInput = document.getElementById("cover");
const coverPreview = document.getElementById("cover-preview");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function coverInitial(title) {
  const first = Array.from(title.trim())[0];
  return escapeHtml(first ? first.toUpperCase() : "?");
}

function displayBook() {
  libraryContent.innerHTML = "";

  if (myLibrary.length === 0) {
    libraryContent.innerHTML =
      '<p class="empty-state">No books yet. Add one above!</p>';
    return;
  }

  myLibrary.forEach((book) => {
    const card = document.createElement("article");
    card.className = "book-card";
    card.dataset.id = book.id;

    const cover = book.cover
      ? `<img class="cover-img" src="${escapeHtml(book.cover)}" alt="Cover of ${escapeHtml(book.title)}">`
      : `<span class="cover-placeholder" aria-hidden="true">${coverInitial(book.title)}</span>`;

    card.innerHTML = `<div class="book-cover">${cover}</div>
                      <div class="book-info">
                        <h3 class="book-title">${escapeHtml(book.title)}</h3>
                        <p class="book-author">${escapeHtml(book.author)}</p>
                        <p class="book-pages">${book.pages} pages</p>
                      </div>
                      <div class="book-actions">
                        <button
                          type="button"
                          class="read-toggle ${book.isRead ? "is-read" : ""}"
                          data-id="${book.id}"
                          aria-pressed="${book.isRead}"
                          aria-label="Mark &quot;${escapeHtml(book.title)}&quot; as ${book.isRead ? "not read" : "read"}">
                          <span class="toggle-track">
                            <span class="toggle-knob"></span>
                          </span>
                          <span class="status-label">${book.isRead ? "Read" : "Not Read"}</span>
                        </button>
                        <button class="btn-delete" type="button" data-id="${book.id}"
                                aria-label="Delete &quot;${escapeHtml(book.title)}&quot;">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            aria-hidden="true">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path
                              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                            ></path>
                          </svg>
                          Delete
                        </button>
                      </div>`;

    libraryContent.appendChild(card);
  });
}

let pendingCoverUrl = null;

function clearPendingCover() {
  if (pendingCoverUrl) {
    URL.revokeObjectURL(pendingCoverUrl);
    pendingCoverUrl = null;
  }
  coverPreview.removeAttribute("src");
  coverPreview.hidden = true;
}

coverInput.addEventListener("change", () => {
  const file = coverInput.files[0];

  if (pendingCoverUrl) {
    URL.revokeObjectURL(pendingCoverUrl);
    pendingCoverUrl = null;
  }

  if (!file) {
    coverPreview.removeAttribute("src");
    coverPreview.hidden = true;
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    coverInput.value = "";
    coverPreview.hidden = true;
    return;
  }

  pendingCoverUrl = URL.createObjectURL(file);
  coverPreview.src = pendingCoverUrl;
  coverPreview.hidden = false;
});

addBookBtn.addEventListener("click", () => {
  modal.showModal();
});

closeModalBtn.addEventListener("click", () => {
  modal.close();
});

modal.addEventListener("close", () => {
  bookForm.reset();
  clearPendingCover();
});

bookForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const pages = parseInt(document.getElementById("pages").value, 10);
  const isRead = document.getElementById("is-read").checked;

  if (!title || !author || Number.isNaN(pages)) {
    alert("Please fill in all fields correctly.");
    return;
  }

  const cover = pendingCoverUrl;
  pendingCoverUrl = null;

  addBookToLibrary(title, author, pages, isRead, cover);
  displayBook();

  modal.close();
});

libraryContent.addEventListener("click", (e) => {
  const toggle = e.target.closest(".read-toggle");
  if (toggle) {
    const book = myLibrary.find((b) => b.id === toggle.dataset.id);
    if (book) {
      book.toggleRead();
      displayBook();
    }
    return;
  }

  const deleteBtn = e.target.closest(".btn-delete");
  if (deleteBtn) {
    const index = myLibrary.findIndex((b) => b.id === deleteBtn.dataset.id);
    if (index !== -1) {
      myLibrary[index].releaseCover();
      myLibrary.splice(index, 1);
      displayBook();
    }
  }
});

addBookToLibrary("Breaking Bad", "Vince Gilligan", 1000, true, "img/bb.jpg");
addBookToLibrary("1984", "George Orwell", 328, true, "img/1984.png");
addBookToLibrary(
  "Better Call Saul",
  "Vince Gilligan",
  1000,
  true,
  "img/bcs.jpg",
);
addBookToLibrary(
  "El Camino: A Breaking Bad Movie",
  "Vince Gilligan",
  1000,
  true,
  "img/jesse-pinkman.jpg",
);
addBookToLibrary(
  "Attack on Titan",
  "Hajime Isayama",
  203,
  true,
  "img/aot.jpg",
);
addBookToLibrary(
  "The Rick and Morty Book One Deluxe Edition",
  " Zac Gorman",
  296,
  true,
  "img/r&m.jpg",
);
displayBook();
