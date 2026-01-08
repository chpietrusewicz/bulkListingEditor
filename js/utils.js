// Utility Functions

// Helper function to escape CSV values
function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    value = String(value);
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
}

// Simple HTML escape for title strings
function escapeHtml(str) {
    return String(str).replace(/[&<>"'`]/g, function (s) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;", "`": "&#96;" })[s];
    });
}
