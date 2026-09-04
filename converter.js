const ABSOLUTE_ZERO = {
  celsius: -273.15,
  fahrenheit: -459.67,
  kelvin: 0,
};

/**
 * Converts a numeric temperature value from one unit to the other two.
 * @param {number} value - the numeric temperature to convert
 * @param {"celsius"|"fahrenheit"|"kelvin"} fromUnit - the original unit
 * @returns {{celsius:number, fahrenheit:number, kelvin:number}} all three values
 */
function convertTemperature(value, fromUnit) {
  let celsius;

  // Normalize everything to Celsius first, then derive the other two.
  if (fromUnit === "celsius") {
    celsius = value;
  } else if (fromUnit === "fahrenheit") {
    celsius = (value - 32) * (5 / 9);
  } else if (fromUnit === "kelvin") {
    celsius = value - 273.15;
  } else {
    throw new Error("Unknown unit: " + fromUnit);
  }

  const fahrenheit = celsius * (9 / 5) + 32;
  const kelvin = celsius + 273.15;

  return { celsius, fahrenheit, kelvin };
}

/**
 * Validates raw user input before conversion.
 * @param {string} rawValue - the raw text from the input field
 * @param {"celsius"|"fahrenheit"|"kelvin"} unit - the selected unit
 * @returns {{valid:boolean, message:string, numericValue:number|null}}
 */
function validateTemperature(rawValue, unit) {
  const trimmed = (rawValue || "").trim();

  if (trimmed === "") {
    return { valid: false, message: "Please enter a valid temperature.", numericValue: null };
  }

  const numericValue = Number(trimmed);

  if (Number.isNaN(numericValue) || !Number.isFinite(numericValue)) {
    return { valid: false, message: "Please enter a valid temperature.", numericValue: null };
  }

  if (unit === "kelvin" && numericValue < 0) {
    return { valid: false, message: "Kelvin temperature cannot be below 0 K.", numericValue: null };
  }

  const floor = ABSOLUTE_ZERO[unit];
  if (numericValue < floor) {
    const unitSymbol = unit === "celsius" ? "°C" : unit === "fahrenheit" ? "°F" : "K";
    return {
      valid: false,
      message: `Temperature cannot be below absolute zero (${floor.toFixed(2)} ${unitSymbol}).`,
      numericValue: null,
    };
  }

  return { valid: true, message: "", numericValue };
}

const UNIT_META = {
  celsius: { label: "Celsius", symbol: "°C" },
  fahrenheit: { label: "Fahrenheit", symbol: "°F" },
  kelvin: { label: "Kelvin", symbol: "K" },
};

/**
 * Renders the two converted-unit result tiles (excludes the original unit)
 * and reveals the results section with the success status line.
 * @param {number} inputValue
 * @param {"celsius"|"fahrenheit"|"kelvin"} fromUnit
 * @param {{celsius:number, fahrenheit:number, kelvin:number}} converted
 */
function displayResult(inputValue, fromUnit, converted) {
  const resultGrid = document.getElementById("resultGrid");
  const resultsSection = document.getElementById("resultsSection");
  const statusLine = document.getElementById("statusLine");

  const otherUnits = Object.keys(UNIT_META).filter((u) => u !== fromUnit);

  resultGrid.innerHTML = otherUnits
    .map((unit) => {
      const meta = UNIT_META[unit];
      const value = converted[unit].toFixed(2);
      return `
        <div class="result-tile">
          <div class="unit-label">${meta.label}</div>
          <div class="unit-value">${value} ${meta.symbol}</div>
        </div>
      `;
    })
    .join("");

  resultsSection.classList.remove("hidden");
  statusLine.classList.remove("hidden");
  statusLine.querySelector(".status-text").textContent =
    `Converted ${inputValue} ${UNIT_META[fromUnit].symbol} successfully.`;
}

/**
 * Shows an inline error alert card with the given message and hides
 * the results section so stale results are never shown alongside an error.
 * @param {string} message
 */
function showError(message) {
  const errorAlert = document.getElementById("errorAlert");
  const resultsSection = document.getElementById("resultsSection");
  const statusLine = document.getElementById("statusLine");
  const tempInput = document.getElementById("tempInput");

  errorAlert.querySelector(".alert-message").textContent = message;
  errorAlert.classList.remove("hidden");
  resultsSection.classList.add("hidden");
  statusLine.classList.add("hidden");
  tempInput.classList.add("invalid");
}

/** Hides the error alert card and clears the invalid input state. */
function hideError() {
  const errorAlert = document.getElementById("errorAlert");
  const tempInput = document.getElementById("tempInput");
  errorAlert.classList.add("hidden");
  tempInput.classList.remove("invalid");
}

/**
 * Saves one successful conversion record to localStorage under the
 * "temporaHistory" key, keeping the newest record first.
 * @param {number} inputValue
 * @param {"celsius"|"fahrenheit"|"kelvin"} fromUnit
 * @param {{celsius:number, fahrenheit:number, kelvin:number}} converted
 */
function saveConversion(inputValue, fromUnit, converted) {
  const otherUnits = Object.keys(UNIT_META).filter((u) => u !== fromUnit);
  const now = new Date();

  const record = {
    input: inputValue,
    unit: UNIT_META[fromUnit].symbol,
    result1Label: UNIT_META[otherUnits[0]].symbol,
    result1: converted[otherUnits[0]].toFixed(2),
    result2Label: UNIT_META[otherUnits[1]].symbol,
    result2: converted[otherUnits[1]].toFixed(2),
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
  };

  let history = [];
  try {
    history = JSON.parse(localStorage.getItem("temporaHistory")) || [];
  } catch (err) {
    history = [];
  }

  history.unshift(record);
  localStorage.setItem("temporaHistory", JSON.stringify(history));
}

/** Resets the converter form back to its empty starting state. */
function clearConverter() {
  const form = document.getElementById("converterForm");
  const resultsSection = document.getElementById("resultsSection");
  const statusLine = document.getElementById("statusLine");

  form.reset();
  hideError();
  resultsSection.classList.add("hidden");
  statusLine.classList.add("hidden");

  const tempInput = document.getElementById("tempInput");
  tempInput.focus();
}

/**
 * Handles the Convert button click: validates input, runs the conversion,
 * displays the result (with a brief processing state), and stores history.
 */
function handleConvertSubmit(event) {
  event.preventDefault();

  const tempInput = document.getElementById("tempInput");
  const unitSelect = document.getElementById("unitSelect");
  const convertBtn = document.getElementById("convertBtn");
  const statusLine = document.getElementById("statusLine");

  hideError();

  const { valid, message, numericValue } = validateTemperature(tempInput.value, unitSelect.value);

  if (!valid) {
    showError(message);
    return;
  }

  // Brief processing state so the conversion feels like a real action.
  convertBtn.disabled = true;
  statusLine.classList.remove("hidden");
  statusLine.classList.add("processing");
  statusLine.querySelector(".status-text").textContent = "Calculating...";

  window.setTimeout(() => {
    const converted = convertTemperature(numericValue, unitSelect.value);
    displayResult(numericValue, unitSelect.value, converted);
    saveConversion(numericValue, unitSelect.value, converted);

    statusLine.classList.remove("processing");
    convertBtn.disabled = false;
  }, 350);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("converterForm");
  const clearBtn = document.getElementById("clearBtn");
  const tempInput = document.getElementById("tempInput");

  if (!form) return; // Not on the converter page.

  form.addEventListener("submit", handleConvertSubmit);
  clearBtn.addEventListener("click", clearConverter);
  tempInput.addEventListener("input", hideError);
});