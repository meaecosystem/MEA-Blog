/*
  MEA BLOG — listing, search, sort, category filter
  ==============================================
  Semua statis, murni client-side. Sumber data: /data/articles.json
  Tambah artikel baru = tambah 1 object ke articles.json (termasuk field
  "icon" untuk ikon konkret di card), tidak perlu ubah index.html atau
  file ini — kecuali menambah ikon baru ke MEA_ICONS.
*/

const BLOG_CATEGORIES = [
  { id: "all", label: "Semua" },
  { id: "convert", label: "Konversi" },
  { id: "image", label: "Gambar" },
  { id: "text", label: "Teks" },
  { id: "privasi", label: "Privasi & Keamanan" },
  { id: "riset", label: "Riset & AI" },
  { id: "utilitas", label: "Utilitas" },
  { id: "tentang", label: "Tentang MEA Tools" },
];

const BLOG_SORTS = [
  { id: "newest", label: "Terbaru" },
  { id: "oldest", label: "Terlama" },
  { id: "az", label: "A–Z" },
];

/* Ikon konkret per objek/topik (bukan ikon generik kategori).
   "pdf to image" -> ikon dokumen PDF, "image to pdf" -> ikon gambar, dst.
   Tambahkan entri baru di sini kalau ada topik/objek baru. */
const MEA_ICONS = {
  pdf: '<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/><text x="8" y="17" font-size="6" font-family="monospace" fill="currentColor" stroke="none">PDF</text>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 15-5-5-9 9"/>',
  text: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  lock: '<rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  ai: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v.01"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m10.5 12.5 8-8M16 5l2 2M13 8l2 2"/>',
  code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M13 6l-2 12"/>',
  hash: '<path d="M5 9h14M5 15h14M10 3 7 21M17 3l-3 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  gift: '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 12h18M12 8v13"/><path d="M12 8c-1.2 0-3-1-3-2.6A2.4 2.4 0 0 1 11.4 3c1.6 0 2.6 2 .6 5ZM12 8c1.2 0 3-1 3-2.6A2.4 2.4 0 0 0 12.6 3c-1.6 0-2.6 2-.6 5Z"/>',
  gauge: '<circle cx="12" cy="13" r="8"/><path d="M12 13 16 9M9 4.6l.3 1M15 4.6l-.3 1M4.6 9l1 .3M19.4 9l-1 .3"/>',
  default: '<circle cx="12" cy="12" r="9"/>',
};

function meaIconSvg(key) {
  const paths = MEA_ICONS[key] || MEA_ICONS.default;
  return '<svg class="mea-article-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + paths + "</svg>";
}

(function () {
  const gridEl = document.getElementById("mea-article-grid");
  const catEl = document.getElementById("mea-categories");
  const searchEl = document.getElementById("mea-search");
  const sortEl = document.getElementById("mea-sort");

  if (!gridEl) return; // halaman ini bukan homepage

  let articles = [];
  let activeCategory = "all";
  let activeSort = "newest";
  let query = "";

  function renderCategories() {
    catEl.innerHTML = BLOG_CATEGORIES.map(function (cat) {
      const active = cat.id === activeCategory ? " active" : "";
      return '<button type="button" class="mea-category-btn' + active + '" data-cat="' + cat.id + '">' + cat.label + "</button>";
    }).join("");

    catEl.querySelectorAll(".mea-category-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeCategory = btn.getAttribute("data-cat");
        renderCategories();
        renderGrid();
      });
    });
  }

  function renderSortOptions() {
    if (!sortEl) return;
    sortEl.innerHTML = BLOG_SORTS.map(function (s) {
      return '<option value="' + s.id + '">' + s.label + "</option>";
    }).join("");
    sortEl.value = activeSort;
  }

  function matchesQuery(article, q) {
    if (!q) return true;
    const haystack = (
      article.title + " " + article.desc + " " + (article.keywords || []).join(" ")
    ).toLowerCase();
    return haystack.includes(q.toLowerCase());
  }

  function sortArticles(list) {
    const copy = list.slice();
    if (activeSort === "newest") {
      copy.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    } else if (activeSort === "oldest") {
      copy.sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    } else if (activeSort === "az") {
      copy.sort(function (a, b) { return a.title.localeCompare(b.title); });
    }
    return copy;
  }

  function renderGrid() {
    const filtered = sortArticles(
      articles.filter(function (a) {
        const catOk = activeCategory === "all" || a.category === activeCategory;
        return catOk && matchesQuery(a, query);
      })
    );

    if (filtered.length === 0) {
      gridEl.innerHTML = '<div class="mea-empty-state">Belum ada artikel yang cocok. Coba kata kunci lain.</div>';
      return;
    }

    gridEl.innerHTML = filtered.map(function (a) {
      const catLabel = (BLOG_CATEGORIES.find(function (c) { return c.id === a.category; }) || {}).label || a.category;
      return (
        '<a href="' + a.url + '" class="mea-article-card glass">' +
          meaIconSvg(a.icon) +
          '<span class="mea-category-tag">' + catLabel + "</span>" +
          "<h3>" + a.title + "</h3>" +
          "<p>" + a.desc + "</p>" +
          '<span class="mea-article-date">' + a.date + "</span>" +
        "</a>"
      );
    }).join("");
  }

  fetch("/data/articles.json")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      articles = data;
      renderCategories();
      renderSortOptions();
      renderGrid();
    })
    .catch(function () {
      gridEl.innerHTML = '<div class="mea-empty-state">Gagal memuat daftar artikel.</div>';
    });

  if (searchEl) {
    searchEl.addEventListener("input", function () {
      query = searchEl.value;
      renderGrid();
    });
  }

  if (sortEl) {
    sortEl.addEventListener("change", function () {
      activeSort = sortEl.value;
      renderGrid();
    });
  }
})();
