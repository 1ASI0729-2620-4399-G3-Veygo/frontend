/**
 * Infrastructure helper that exports transactions as a CSV file the owner can download.
 *
 * @param {Object[]} rows - Rows with already formatted values.
 * @param {string[]} headers - Column titles.
 * @param {string} fileName - Name of the file to download.
 */
export const downloadCsvReport = (rows, headers, fileName) => {
    const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const content = [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + content], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};
