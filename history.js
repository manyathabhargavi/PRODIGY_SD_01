
/**
 * Reads the saved conversion history from localStorage.
 * @returns {Array<Object>} an array of conversion records, newest first
 */
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem("temporaHistory")) || [];
  } catch (err) {
    return [];
  }
}

/** Removes all saved conversion history and re-renders an empty state. */
function clearHistory() {
  localStorage.removeItem("temporaHistory");
  renderHistory();
}

/**
 * Renders the current history into the table, the mobile card list,
 * the record count, and toggles the empty-state message as needed.
 */
function renderHistory() {
  const history = loadHistory();

  const tableWrap = document.getElementById("historyTableWrap");
  const tableBody = document.getElementById("historyTableBody");
  const cardsWrap = document.getElementById("historyCards");
  const emptyState = document.getElementById("emptyState");
  const countLabel = document.getElementById("historyCount");
  const clearBtn = document.getElementById("clearHistoryBtn");

  countLabel.textContent = history.length === 1 ? "1 record" : `${history.length} records`;
  clearBtn.disabled = history.length === 0;

  if (history.length === 0) {
    tableWrap.classList.add("hidden");
    cardsWrap.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  tableWrap.classList.remove("hidden");
  cardsWrap.classList.remove("hidden");

  tableBody.innerHTML = history
    .map(
      (record) => `
        <tr>
          <td>${record.input}</td>
          <td>${record.unit}</td>
          <td>${record.result1} ${record.result1Label}</td>
          <td>${record.result2} ${record.result2Label}</td>
          <td>${record.date}</td>
          <td>${record.time}</td>
        </tr>
      `
    )
    .join("");

  cardsWrap.innerHTML = history
    .map(
      (record) => `
        <div class="history-card">
          <div class="hc-row"><span class="hc-key">Input</span><span>${record.input} ${record.unit}</span></div>
          <div class="hc-row"><span class="hc-key">${record.result1Label}</span><span>${record.result1} ${record.result1Label}</span></div>
          <div class="hc-row"><span class="hc-key">${record.result2Label}</span><span>${record.result2} ${record.result2Label}</span></div>
          <div class="hc-row"><span class="hc-key">Saved</span><span>${record.date} · ${record.time}</span></div>
        </div>
      `
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const clearBtn = document.getElementById("clearHistoryBtn");
  if (!clearBtn) return; // Not on the history page.

  renderHistory();

  clearBtn.addEventListener("click", () => {
    if (clearBtn.disabled) return;
    const confirmed = window.confirm("Clear all conversion history? This cannot be undone.");
    if (confirmed) {
      clearHistory();
    }
  });
});