const form = document.getElementById('meter-form');
const errorMessage = document.getElementById('form-error');
const results = document.getElementById('results');
const exportButton = document.getElementById('export-button');
const exportMessage = document.getElementById('export-message');
let latestReport = null;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorMessage.hidden = true;
  exportMessage.textContent = '';

  const formData = new FormData(form);
  const input = {
    meterId: formData.get('meterId'),
    previousReading: formData.get('previousReading'),
    currentReading: formData.get('currentReading')
  };

  try {
    latestReport = await window.voltTrack.analyze(input);
    renderResult(latestReport);
    results.hidden = false;
    if (latestReport.status === 'investigate') {
      await window.voltTrack.notifyHighRisk(latestReport.meterId);
    }
  } catch (error) {
    errorMessage.textContent = error.message || 'Unable to analyze these readings.';
    errorMessage.hidden = false;
    results.hidden = true;
    latestReport = null;
  }
});

function renderResult(report) {
  const flagged = report.status === 'investigate';
  const banner = document.getElementById('result-banner');
  banner.className = `result-banner ${report.status}`;
  document.getElementById('result-icon').textContent = flagged ? '!' : '✓';
  document.getElementById('result-label').textContent = flagged ? 'REVIEW SUGGESTED' : 'WITHIN DEMONSTRATION RANGE';
  document.getElementById('result-title').textContent = flagged ? 'Unusually high consumption' : 'Consumption looks typical';
  document.getElementById('result-description').textContent = flagged
    ? 'This reading is above the simple review threshold. Consider checking the meter and its context.'
    : 'This reading is within the simple demonstration threshold for monthly consumption.';
  document.getElementById('result-meter').textContent = `Meter ${report.meterId}`;
  document.getElementById('consumption-value').textContent = `${formatNumber(report.consumption)} kWh`;
  document.getElementById('risk-score').textContent = report.riskScore;
  document.getElementById('risk-level').textContent = flagged ? 'Elevated · review suggested' : 'Low · within range';
}

function formatNumber(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

exportButton.addEventListener('click', async () => {
  if (!latestReport) return;
  exportMessage.textContent = '';
  exportButton.disabled = true;
  try {
    const outcome = await window.voltTrack.exportReport(latestReport);
    exportMessage.textContent = outcome.canceled ? 'Export canceled.' : 'Report exported.';
  } catch (error) {
    exportMessage.textContent = error.message || 'Could not export report.';
  } finally {
    exportButton.disabled = false;
  }
});
