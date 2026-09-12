/**
 * Seat & Room Allocator — Main Script
 * Pure Vanilla JavaScript, no frameworks.
 *
 * Features:
 *  - CSV file upload (drag & drop + click)
 *  - Manual text input
 *  - Sorting by register number or name
 *  - Room capacity configuration
 *  - Automatic sequential seat/room allocation (rooms start at 101)
 *  - Real-time search with highlighted matches
 *  - CSV export
 *  - Toast notifications
 *  - Loading animation
 *  - Reset functionality
 */

/* =============================================
   STATE
   ============================================= */

/** @type {{ registerNumber: string, studentName: string }[]} */
let students = [];

/** @type {{ registerNumber: string, studentName: string, roomNumber: number, seatNumber: number }[]} */
let allocations = [];

/** The currently visible (possibly filtered) allocations */
let filteredAllocations = [];

/* =============================================
   DOM REFERENCES
   ============================================= */
const uploadArea        = document.getElementById('upload-area');
const csvFileInput      = document.getElementById('csv-file-input');
const fileInfo          = document.getElementById('file-info');
const fileNameDisplay   = document.getElementById('file-name-display');
const removeFileBtn     = document.getElementById('remove-file-btn');
const manualInput       = document.getElementById('manual-input');
const roomCapacityInput = document.getElementById('room-capacity');
const allocateBtn       = document.getElementById('allocate-btn');
const resetBtn          = document.getElementById('reset-btn');
const resultsSection    = document.getElementById('results-section');
const searchInput       = document.getElementById('search-input');
const downloadBtn       = document.getElementById('download-btn');
const resultsTbody      = document.getElementById('results-tbody');
const resultsCount      = document.getElementById('results-count');
const emptyState        = document.getElementById('empty-state');
const loadingOverlay    = document.getElementById('loading-overlay');
const statStudents      = document.getElementById('stat-students');
const statRooms         = document.getElementById('stat-rooms');
const statSeats         = document.getElementById('stat-seats');

/* =============================================
   TOAST NOTIFICATIONS
   ============================================= */

const toastContainer = document.getElementById('toast-container');

/**
 * Show a toast notification.
 * @param {string} message  - The message to display.
 * @param {'success'|'error'|'info'} type - Toast variant.
 * @param {number} duration - Auto-dismiss delay in ms (default 3500).
 */
function showToast(message, type = 'success', duration = 3500) {
  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-msg">${escapeHtml(message)}</div>
  `;
  toastContainer.appendChild(toast);

  // Auto-dismiss
  const timer = setTimeout(() => dismissToast(toast), duration);
  toast.addEventListener('click', () => { clearTimeout(timer); dismissToast(toast); });
}

/**
 * Animate and remove a toast element.
 * @param {HTMLElement} toast
 */
function dismissToast(toast) {
  toast.classList.add('toast-out');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

/* =============================================
   LOADING OVERLAY
   ============================================= */

function showLoading() {
  loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

/* =============================================
   CSV PARSING  (RFC-4180 compliant)
   ============================================= */

/**
 * Parse a full CSV text into an array of rows (each row is an array of
 * field strings). Handles:
 *  - Quoted fields containing commas and newlines
 *  - Escaped double-quotes (`""` inside a quoted field → single `"`)
 *  - CRLF and LF line endings
 *
 * @param {string} text - Raw CSV text
 * @returns {string[][]} - Array of rows, each row is an array of fields
 */
function parseCSVRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead: `""` is an escaped quote inside a quoted field
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field.trim());
        field = '';
        i++;
      } else if (ch === '\r') {
        // CR or CRLF — end of record
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
        if (i + 1 < text.length && text[i + 1] === '\n') i++;
        i++;
      } else if (ch === '\n') {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Flush last field / row
  if (field || row.length > 0) {
    row.push(field.trim());
    if (row.some((f) => f !== '')) rows.push(row);
  }

  return rows;
}

/**
 * Detect whether a row looks like a header row.
 * Matches common patterns for a register-number column header.
 * @param {string} firstCell
 * @returns {boolean}
 */
function isHeaderRow(firstCell) {
  // Normalise: lowercase, remove spaces/punctuation
  const normalised = firstCell.toLowerCase().replace(/[\s._\-/#]/g, '');
  const headerPatterns = [
    'registernumber', 'register', 'regno', 'regnum', 'rollno',
    'rollnumber', 'studentid', 'admno', 'admissionnumber', 'id',
    'sno', 'serialno', 'no', 'number', 'enrolmentno',
  ];
  return headerPatterns.some((p) => normalised === p || normalised.startsWith(p));
}

/**
 * Parse CSV text into an array of student objects.
 * Skips the header row automatically if detected.
 * @param {string} csvText
 * @returns {{ registerNumber: string, studentName: string }[]}
 */
function parseCSV(csvText) {
  const allRows = parseCSVRows(csvText.trim());
  const result = [];

  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i];
    if (row.length < 2) continue;

    const col0 = row[0];
    const col1 = row[1];

    // Skip header row (first row only)
    if (i === 0 && isHeaderRow(col0)) continue;

    if (!col0 || !col1) continue;

    result.push({ registerNumber: col0, studentName: col1 });
  }

  return result;
}

/* =============================================
   FILE UPLOAD — DRAG & DROP
   ============================================= */

/** Handle the dropped or selected File object */
function handleFile(file) {
  if (!file) return;

  // Validate file type
  if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/csv') {
    showToast('Please upload a valid .csv file.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const parsed = parseCSV(text);

    if (parsed.length === 0) {
      showToast('CSV file appears empty or has no valid rows.', 'error');
      return;
    }

    students = parsed;

    // Show file info
    fileNameDisplay.textContent = `${file.name} — ${parsed.length} student${parsed.length !== 1 ? 's' : ''} found`;
    fileInfo.classList.remove('hidden');
    uploadArea.classList.add('has-file');
    manualInput.value = '';
    manualInput.disabled = true;

    showToast(`Loaded ${parsed.length} student${parsed.length !== 1 ? 's' : ''} from ${file.name}`, 'success');
  };

  reader.onerror = () => showToast('Failed to read the file. Please try again.', 'error');
  reader.readAsText(file);
}

// Drag & Drop events on upload area
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  handleFile(file);
});

// File input change
csvFileInput.addEventListener('change', () => {
  handleFile(csvFileInput.files[0]);
});

// Remove file button
removeFileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  clearFileUpload();
});

function clearFileUpload() {
  students = [];
  csvFileInput.value = '';
  fileInfo.classList.add('hidden');
  uploadArea.classList.remove('has-file');
  manualInput.disabled = false;
}

/* =============================================
   SORTING
   ============================================= */

/**
 * Sort the students array according to the chosen radio option.
 * @param {{ registerNumber: string, studentName: string }[]} arr
 * @returns {{ registerNumber: string, studentName: string }[]}
 */
function sortStudents(arr) {
  const sortBy = document.querySelector('input[name="sort-option"]:checked').value;
  const copy = [...arr];

  if (sortBy === 'register') {
    // Natural sort for register numbers (handles 22CS001 < 22CS002 etc.)
    copy.sort((a, b) => naturalCompare(a.registerNumber, b.registerNumber));
  } else {
    copy.sort((a, b) => a.studentName.localeCompare(b.studentName, undefined, { sensitivity: 'base' }));
  }

  return copy;
}

/**
 * Natural alphanumeric comparison so "22CS2" < "22CS10".
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/* =============================================
   ALLOCATION LOGIC
   ============================================= */

/**
 * Allocate room and seat numbers to the given sorted students.
 * Rooms start at 101, seats restart from 1 in each room.
 *
 * @param {{ registerNumber: string, studentName: string }[]} sortedStudents
 * @param {number} capacity - Number of seats per room
 * @returns {{ registerNumber: string, studentName: string, roomNumber: number, seatNumber: number }[]}
 */
function allocateSeats(sortedStudents, capacity) {
  const result = [];
  let roomNumber = 101;
  let seatNumber = 1;

  for (const student of sortedStudents) {
    result.push({
      registerNumber: student.registerNumber,
      studentName: student.studentName,
      roomNumber,
      seatNumber,
    });

    seatNumber++;
    if (seatNumber > capacity) {
      roomNumber++;
      seatNumber = 1;
    }
  }

  return result;
}

/* =============================================
   RENDER TABLE
   ============================================= */

/**
 * Render the allocations table, highlighting search term matches.
 * @param {{ registerNumber: string, studentName: string, roomNumber: number, seatNumber: number }[]} data
 * @param {string} query - Current search query for highlighting.
 */
function renderTable(data, query = '') {
  resultsTbody.innerHTML = '';

  if (data.length === 0) {
    emptyState.classList.remove('hidden');
    resultsCount.textContent = '';
    return;
  }

  emptyState.classList.add('hidden');

  const totalFiltered = data.length;
  const totalAll = allocations.length;
  resultsCount.textContent =
    query.trim()
      ? `Showing ${totalFiltered} of ${totalAll} student${totalAll !== 1 ? 's' : ''}`
      : `${totalAll} student${totalAll !== 1 ? 's' : ''} allocated`;

  const fragment = document.createDocumentFragment();

  data.forEach((row, index) => {
    const tr = document.createElement('tr');
    // Stagger row animation
    tr.style.animationDelay = `${Math.min(index * 18, 300)}ms`;

    const regCell  = query ? highlightMatch(row.registerNumber, query) : escapeHtml(row.registerNumber);
    const nameCell = query ? highlightMatch(row.studentName, query)    : escapeHtml(row.studentName);

    tr.innerHTML = `
      <td>${regCell}</td>
      <td>${nameCell}</td>
      <td><span class="room-badge">Room ${row.roomNumber}</span></td>
      <td><span class="seat-badge">${row.seatNumber}</span></td>
    `;

    fragment.appendChild(tr);
  });

  resultsTbody.appendChild(fragment);
}

/**
 * Wrap occurrences of `query` inside `text` with a highlight span.
 * @param {string} text
 * @param {string} query
 * @returns {string} HTML string
 */
function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const escapedQuery = escapeRegExp(query);
  return escaped.replace(new RegExp(escapedQuery, 'gi'), (match) => `<mark class="highlight">${match}</mark>`);
}

/* =============================================
   SEARCH
   ============================================= */

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    filteredAllocations = [...allocations];
  } else {
    filteredAllocations = allocations.filter(
      (row) =>
        row.registerNumber.toLowerCase().includes(query) ||
        row.studentName.toLowerCase().includes(query)
    );
  }

  renderTable(filteredAllocations, searchInput.value.trim());
});

/* =============================================
   ALLOCATE BUTTON
   ============================================= */

allocateBtn.addEventListener('click', () => {
  // Determine data source: uploaded file vs manual input
  let rawStudents = [...students];

  if (rawStudents.length === 0) {
    // Try manual input
    const manualText = manualInput.value.trim();
    if (!manualText) {
      showToast('Please upload a CSV file or enter student data manually.', 'error');
      return;
    }
    rawStudents = parseCSV(manualText);
  }

  if (rawStudents.length === 0) {
    showToast('No valid student records found. Check your data format.', 'error');
    return;
  }

  // Validate room capacity
  const capacity = parseInt(roomCapacityInput.value, 10);
  if (isNaN(capacity) || capacity <= 0) {
    showToast('Room capacity must be a positive number greater than 0.', 'error');
    roomCapacityInput.focus();
    return;
  }
  if (capacity > 10000) {
    showToast('Room capacity seems unusually large. Please double-check.', 'error');
    roomCapacityInput.focus();
    return;
  }

  // Show loading indicator briefly to give user feedback
  showLoading();

  // Use setTimeout to allow the UI to repaint before heavy work
  setTimeout(() => {
    try {
      const sorted = sortStudents(rawStudents);
      allocations = allocateSeats(sorted, capacity);
      filteredAllocations = [...allocations];

      // Calculate stats
      const totalRooms = allocations.length > 0
        ? allocations[allocations.length - 1].roomNumber - 100
        : 0;

      statStudents.textContent = allocations.length;
      statRooms.textContent    = totalRooms;
      statSeats.textContent    = allocations.length;

      // Render table
      renderTable(filteredAllocations, '');
      searchInput.value = '';

      // Show results section
      resultsSection.classList.remove('hidden');
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

      hideLoading();
      showToast(
        `Allocated ${allocations.length} student${allocations.length !== 1 ? 's' : ''} across ${totalRooms} room${totalRooms !== 1 ? 's' : ''}.`,
        'success'
      );
    } catch (err) {
      hideLoading();
      showToast('An unexpected error occurred during allocation. Please try again.', 'error');
      console.error('Allocation error:', err);
    }
  }, 120); // small delay lets loading spinner appear
});

/* =============================================
   RESET
   ============================================= */

resetBtn.addEventListener('click', () => {
  // Clear state
  students = [];
  allocations = [];
  filteredAllocations = [];

  // Reset inputs
  clearFileUpload();
  manualInput.value       = '';
  manualInput.disabled    = false;
  roomCapacityInput.value = '30';
  searchInput.value       = '';

  // Reset sort to default
  document.querySelector('input[name="sort-option"][value="register"]').checked = true;

  // Hide results
  resultsSection.classList.add('hidden');
  resultsTbody.innerHTML = '';
  resultsCount.textContent = '';

  // Reset stats
  statStudents.textContent = '0';
  statRooms.textContent    = '0';
  statSeats.textContent    = '0';

  showToast('All data has been cleared.', 'info');
});

/* =============================================
   CSV DOWNLOAD
   ============================================= */

downloadBtn.addEventListener('click', () => {
  if (allocations.length === 0) {
    showToast('No allocations to download.', 'error');
    return;
  }

  const rows = [
    ['Register Number', 'Student Name', 'Room Number', 'Seat Number'],
    ...allocations.map((row) => [
      row.registerNumber,
      row.studentName,
      row.roomNumber,
      row.seatNumber,
    ]),
  ];

  const csvContent = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = 'seat_room_allocation.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Allocation CSV downloaded successfully.', 'success');
});

/* =============================================
   UTILITY FUNCTIONS
   ============================================= */

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape special RegExp characters in a string.
 * @param {string} str
 * @returns {string}
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* =============================================
   INIT
   ============================================= */

// Focus the manual input on page load
window.addEventListener('DOMContentLoaded', () => {
  // Add click-through behaviour so the entire upload-area triggers file picker
  // (excluding the button inside which also triggers it)
  uploadArea.addEventListener('click', (e) => {
    if (e.target.closest('.btn')) return; // avoid double-trigger from the button
    csvFileInput.click();
  });
});