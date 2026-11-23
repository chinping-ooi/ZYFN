/** Reusable client-side table for the standalone ZYFN prototype. */
class ZyfnDataTable {
  constructor(host, label) {
    this.columns = [];
    this.rows = [];
    this.page = 1;
    this.pageSize = 25;
    this.sortKey = null;
    this.sortDirection = 'ascending';
    this.scope = null;
    this.collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

    const toolbar = this.element('div', 'data-table-toolbar');
    this.search = this.element('input', 'table-search');
    this.search.type = 'search';
    this.search.placeholder = 'Search all columns';
    this.search.setAttribute('aria-label', 'Search ' + label);
    const exportButton = this.element('button', 'page-button', 'Export');
    exportButton.type = 'button';
    exportButton.addEventListener('click', () => this.openExport());
    toolbar.append(this.search, exportButton);
    this.search.addEventListener('input', () => {
      this.page = 1;
      this.render();
    });

    const scroll = this.element('div', 'data-table-scroll');
    this.table = this.element('table');
    this.table.setAttribute('aria-label', label);
    this.head = this.element('thead');
    this.body = this.element('tbody');
    this.table.append(this.head, this.body);
    scroll.append(this.table);

    const footer = this.element('div', 'data-table-footer');
    this.range = this.element('span');
    this.range.setAttribute('role', 'status');
    const controls = this.element('div', 'pagination-controls');
    const sizeLabel = this.element('label', '', 'Rows per page');
    const sizeWrap = this.element('span', 'select-wrap');
    this.sizeSelect = this.element('select');
    for (const size of [25, 50, 100, 200, 'all']) {
      const option = this.element('option', '', size === 'all' ? 'All' : String(size));
      option.value = String(size);
      this.sizeSelect.append(option);
    }
    sizeWrap.append(this.sizeSelect);
    sizeLabel.append(sizeWrap);
    this.sizeSelect.addEventListener('change', () => {
      this.pageSize = this.sizeSelect.value === 'all' ? Infinity : Number(this.sizeSelect.value);
      this.page = 1;
      this.render();
    });
    this.previous = this.element('button', 'page-button', 'Previous');
    this.next = this.element('button', 'page-button', 'Next');
    this.previous.type = this.next.type = 'button';
    this.pageLabel = this.element('span', 'page-label');
    this.previous.addEventListener('click', () => {
      this.page = Math.max(1, this.page - 1);
      this.render();
    });
    this.next.addEventListener('click', () => {
      this.page += 1;
      this.render();
    });
    controls.append(sizeLabel, this.previous, this.pageLabel, this.next);
    footer.append(this.range, controls);
    // Keep search creation and placement within the reusable table component.
    const header = host.closest('.card')?.querySelector('.card-head');
    if (header) {
      header.classList.add('data-table-card-head');
      header.append(toolbar);
    } else {
      host.append(toolbar);
    }
    host.append(scroll, footer);
    this.createExportDialog(host, label);
  }

  createExportDialog(host, label) {
    this.exportDialog = this.element('dialog', 'export-dialog');
    this.exportDialog.setAttribute('aria-label', 'Export ' + label);
    const form = this.element('form', 'export-form');
    const title = this.element('h3', '', 'Export records');
    this.exportNote = this.element('p', 'export-note');
    this.exportPeriod = this.element('select');
    for (const [value, text] of [['week', 'Week'], ['month', 'Month'], ['year', 'Year'], ['custom', 'Custom range']]) {
      const option = this.element('option', '', text);
      option.value = value;
      this.exportPeriod.append(option);
    }
    this.exportPeriod.value = 'month';
    const periodLabel = this.element('label', '', 'Period');
    periodLabel.append(this.exportPeriod);
    this.exportDate = this.element('input');
    this.exportDateLabel = this.element('label');
    this.exportDateText = this.element('span');
    this.exportDateLabel.append(this.exportDateText, this.exportDate);
    this.customDates = this.element('div', 'export-custom-dates');
    this.exportStart = this.element('input');
    this.exportEnd = this.element('input');
    this.exportStart.type = this.exportEnd.type = 'date';
    const startLabel = this.element('label', '', 'From');
    const endLabel = this.element('label', '', 'Through');
    startLabel.append(this.exportStart);
    endLabel.append(this.exportEnd);
    this.customDates.append(startLabel, endLabel);
    this.exportError = this.element('p', 'export-error');
    this.exportError.setAttribute('role', 'alert');
    const actions = this.element('div', 'export-actions');
    const cancel = this.element('button', 'page-button', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', () => this.exportDialog.close());
    const download = this.element('button', 'page-button export-primary', 'Export CSV');
    download.type = 'submit';
    actions.append(cancel, download);
    form.append(title, this.exportNote, periodLabel, this.exportDateLabel, this.customDates, this.exportError, actions);
    this.exportDialog.append(form);
    host.append(this.exportDialog);
    this.exportPeriod.addEventListener('change', () => this.updateExportInputs());
    this.exportStart.addEventListener('change', () => this.syncCustomRange());
    this.exportEnd.addEventListener('change', () => this.syncCustomRange());
    form.addEventListener('submit', event => {
      event.preventDefault();
      this.downloadExport();
    });
  }

  openExport() {
    this.exportDateColumn = this.columns.find(column => column.key === 'date')
      || this.columns.find(column => column.type === 'date');
    const dates = this.rows.map(row => row[this.exportDateColumn?.key]).filter(Boolean).sort();
    this.exportAnchor = dates.at(-1) || new Date().toISOString().slice(0, 10);
    this.exportNote.textContent = `CSV includes matching records loaded in this table across all pages. Date field: ${this.exportDateColumn?.label || 'unavailable'}. Weeks run Monday through Sunday.`;
    this.updateExportInputs();
    this.exportDialog.showModal();
  }

  updateExportInputs() {
    const period = this.exportPeriod.value;
    this.exportError.textContent = '';
    this.customDates.hidden = period !== 'custom';
    this.exportDateLabel.hidden = period === 'custom';
    this.exportDate.required = period !== 'custom';
    this.exportStart.required = this.exportEnd.required = period === 'custom';
    this.exportDate.disabled = period === 'custom';
    this.exportStart.disabled = this.exportEnd.disabled = period !== 'custom';
    this.exportDate.removeAttribute('min');
    this.exportDate.removeAttribute('max');
    switch (period) {
      case 'week':
        this.exportDate.type = 'date';
        this.exportDate.value = this.exportAnchor;
        this.exportDateText.textContent = 'Date within week';
        break;
      case 'month':
        this.exportDate.type = 'month';
        this.exportDate.value = this.exportAnchor.slice(0, 7);
        this.exportDateText.textContent = 'Month';
        break;
      case 'year':
        this.exportDate.type = 'number';
        this.exportDate.min = '1900';
        this.exportDate.max = '9999';
        this.exportDate.value = this.exportAnchor.slice(0, 4);
        this.exportDateText.textContent = 'Year';
        break;
      case 'custom':
        this.exportStart.value = this.exportAnchor.slice(0, 7) + '-01';
        this.exportEnd.value = this.exportAnchor;
        this.syncCustomRange();
        break;
    }
  }

  syncCustomRange() {
    this.exportError.textContent = '';
    this.exportEnd.min = this.exportStart.value;
    if (this.exportStart.value && this.exportEnd.value && this.exportEnd.value < this.exportStart.value) {
      this.exportEnd.value = this.exportStart.value;
    }
  }

  exportRange() {
    const period = this.exportPeriod.value;
    const value = this.exportDate.value;
    switch (period) {
      case 'week': {
        const monday = new Date(value + 'T00:00:00Z');
        monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
        const sunday = new Date(monday);
        sunday.setUTCDate(sunday.getUTCDate() + 6);
        return [monday.toISOString().slice(0, 10), sunday.toISOString().slice(0, 10)];
      }
      case 'month': {
        const end = new Date(value + '-01T00:00:00Z');
        end.setUTCMonth(end.getUTCMonth() + 1, 0);
        return [value + '-01', end.toISOString().slice(0, 10)];
      }
      case 'year':
        return [value + '-01-01', value + '-12-31'];
      default:
        return [this.exportStart.value, this.exportEnd.value];
    }
  }

  exportCsv(rows) {
    const quote = value => '"' + String(value).replaceAll('"', '""') + '"';
    const lines = [this.columns.map(column => quote(column.label)).join(',')];
    for (const row of rows) {
      lines.push(this.columns.map(column => {
        const raw = row[column.key];
        let value = this.displayValue(row, column);
        if (column.type === 'date') value = raw || '';
        if (column.type === 'money' && value !== '') value = Number(raw).toFixed(2);
        // Preserve textual fields as text when opened in spreadsheet software.
        if (typeof raw === 'string' && /^\s*[=+\-@\t\r]/.test(value)) value = "'" + value;
        return quote(value);
      }).join(','));
    }
    return '\uFEFF' + lines.join('\r\n');
  }

  downloadExport() {
    try {
      const [start, end] = this.exportRange();
      if (!start || !end || start > end) throw new Error('Choose a valid date range with From on or before Through.');
      const rows = this.filteredRows().filter(row => {
        const date = row[this.exportDateColumn?.key];
        return date && date >= start && date <= end;
      });
      if (!rows.length) throw new Error('No matching records in this date range.');
      const blob = new Blob([this.exportCsv(rows)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = this.element('a');
      link.href = url;
      link.download = `zyfn-${this.scope}-${start}-to-${end}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.exportDialog.close();
    } catch (error) {
      this.exportError.textContent = error.message;
    }
  }

  element(tag, className = '', text = '') {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  setData(columns, rows, scope) {
    if (this.scope !== scope) {
      this.search.value = '';
      this.sortKey = null;
      this.scope = scope;
    }
    this.columns = columns;
    this.rows = rows;
    this.page = 1;
    this.render();
  }

  displayValue(row, column) {
    const value = row[column.key];
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return '';
    switch (column.type) {
      case 'money':
        if (column.zeroAsBlank && value === 0) return '';
        return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
      case 'date':
        return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
      case 'rate':
        return Number(value).toFixed(2) + '%';
      case 'months':
        return value + ' months';
      default:
        return String(value);
    }
  }

  filteredRows() {
    const query = this.search.value.trim().toLocaleLowerCase();
    const rows = this.rows.filter(row => this.columns.some(column =>
      (String(row[column.key] ?? '') + ' ' + this.displayValue(row, column)).toLocaleLowerCase().includes(query)
    ));
    const column = this.columns.find(item => item.key === this.sortKey);
    if (!column) return rows;
    const direction = this.sortDirection === 'ascending' ? 1 : -1;
    return rows.sort((left, right) => {
      const a = left[column.key];
      const b = right[column.key];
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      const comparison = typeof a === 'number' && typeof b === 'number'
        ? a - b : this.collator.compare(String(a), String(b));
      return comparison * direction;
    });
  }

  render() {
    this.head.replaceChildren();
    const heading = this.element('tr');
    for (const column of this.columns) {
      const numeric = ['money', 'rate', 'months'].includes(column.type);
      const cell = this.element('th', numeric ? 'numeric' : '');
      cell.scope = 'col';
      const sort = column.key === this.sortKey ? this.sortDirection : 'none';
      cell.setAttribute('aria-sort', sort);
      const button = this.element('button', 'sort-button', column.label);
      button.type = 'button';
      const nextDirection = sort === 'ascending' ? 'descending' : 'ascending';
      button.setAttribute('aria-label', `Sort ${column.label} ${nextDirection}`);
      const indicator = this.element('span', 'sort-indicator');
      indicator.dataset.direction = sort;
      indicator.setAttribute('aria-hidden', 'true');
      button.append(indicator);
      button.addEventListener('click', () => {
        this.sortKey = column.key;
        this.sortDirection = nextDirection;
        this.page = 1;
        this.render();
      });
      cell.append(button);
      heading.append(cell);
    }
    this.head.append(heading);

    const filtered = this.filteredRows();
    const pageCount = this.pageSize === Infinity ? 1 : Math.max(1, Math.ceil(filtered.length / this.pageSize));
    this.page = Math.min(this.page, pageCount);
    const start = this.pageSize === Infinity ? 0 : (this.page - 1) * this.pageSize;
    const visible = this.pageSize === Infinity ? filtered : filtered.slice(start, start + this.pageSize);
    this.body.replaceChildren();
    for (const row of visible) {
      const line = this.element('tr');
      for (const column of this.columns) {
        const numeric = ['money', 'rate', 'months'].includes(column.type);
        const cell = this.element('td', numeric ? 'numeric' : '');
        cell.textContent = this.displayValue(row, column);
        line.append(cell);
      }
      this.body.append(line);
    }
    if (visible.length === 0) {
      const line = this.element('tr');
      const cell = this.element('td', 'empty-row', this.rows.length ? 'No matching records.' : 'No records in this period.');
      cell.colSpan = this.columns.length;
      line.append(cell);
      this.body.append(line);
    }
    const first = filtered.length ? start + 1 : 0;
    this.range.textContent = `${first}–${start + visible.length} of ${filtered.length} records`;
    this.pageLabel.textContent = `Page ${this.page} of ${pageCount}`;
    this.previous.disabled = this.page === 1;
    this.next.disabled = this.page >= pageCount;
  }
}
