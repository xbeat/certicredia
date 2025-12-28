/**
 * Simple client-side pagination helper
 */

class Pagination {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.currentPage = 1;
    this.itemsPerPage = options.itemsPerPage || 20;
    this.items = [];
    this.onPageChange = options.onPageChange || null;
  }

  setItems(items) {
    this.items = items;
    this.currentPage = 1;
    return this.getCurrentPageItems();
  }

  getCurrentPageItems() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.items.slice(start, end);
  }

  getTotalPages() {
    return Math.ceil(this.items.length / this.itemsPerPage);
  }

  goToPage(page) {
    const totalPages = this.getTotalPages();
    if (page < 1 || page > totalPages) return;

    this.currentPage = page;
    if (this.onPageChange) {
      this.onPageChange(this.getCurrentPageItems(), page, totalPages);
    }
    this.renderControls();
    return this.getCurrentPageItems();
  }

  nextPage() {
    return this.goToPage(this.currentPage + 1);
  }

  prevPage() {
    return this.goToPage(this.currentPage - 1);
  }

  renderControls() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const totalPages = this.getTotalPages();
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, this.items.length);

    container.innerHTML = `
      <div class="flex items-center justify-between px-4 py-3 bg-slate-800 border-t border-slate-700">
        <div class="flex items-center text-sm text-slate-400">
          <span>Mostrando <span class="font-medium text-white">${startItem}</span> - <span class="font-medium text-white">${endItem}</span> di <span class="font-medium text-white">${this.items.length}</span> risultati</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            onclick="window.${this.containerId}_pagination.prevPage()"
            ${this.currentPage === 1 ? 'disabled' : ''}
            class="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            Precedente
          </button>
          <span class="text-sm text-slate-400">
            Pagina <span class="font-medium text-white">${this.currentPage}</span> di <span class="font-medium text-white">${totalPages}</span>
          </span>
          <button
            onclick="window.${this.containerId}_pagination.nextPage()"
            ${this.currentPage === totalPages ? 'disabled' : ''}
            class="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            Successiva
          </button>
        </div>
      </div>
    `;
  }
}
