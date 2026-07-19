export function downloadCSV(data, filename = 'export.csv') {
  if (!data || !data.length) return;

  // Extract headers
  // For submissions, we want to flatten the 'answers' JSON object
  const allKeys = new Set();
  data.forEach(row => {
    Object.keys(row).forEach(key => {
      if (key !== 'answers') allKeys.add(key);
    });
    if (row.answers && typeof row.answers === 'object') {
      Object.keys(row.answers).forEach(k => allKeys.add(`answer_${k}`));
    }
  });

  const headers = Array.from(allKeys);

  // Build CSV rows
  const csvRows = [];
  // Header row
  csvRows.push(headers.map(h => `"${h}"`).join(','));

  // Data rows
  data.forEach(row => {
    const values = headers.map(header => {
      let val = '';
      if (header.startsWith('answer_')) {
        const answerKey = header.replace('answer_', '');
        val = row.answers?.[answerKey] ?? '';
      } else {
        val = row[header] ?? '';
      }
      
      // Escape quotes and wrap in quotes
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
