import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Sorts participant list according to selected criteria
 */
export const sortParticipants = (participants = [], sortOrder = 'name-asc') => {
  const list = [...participants];

  switch (sortOrder) {
    case 'name-asc':
      return list.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
    case 'name-desc':
      return list.sort((a, b) => (b.studentName || '').localeCompare(a.studentName || ''));
    case 'email-asc':
      return list.sort((a, b) => (a.studentEmail || '').localeCompare(b.studentEmail || ''));
    case 'date-asc':
      return list.sort((a, b) => new Date(a.registrationDate || 0) - new Date(b.registrationDate || 0));
    case 'date-desc':
      return list.sort((a, b) => new Date(b.registrationDate || 0) - new Date(a.registrationDate || 0));
    default:
      return list.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
  }
};

/**
 * Generates and downloads a clean, professional PDF report of registered students
 * @param {Object} event - Event details
 * @param {Array} participants - List of registered participants
 * @param {String} sortOrder - Current sort order key
 */
export const generateParticipantsPDF = (event, participants, sortOrder = 'name-asc') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Sort participants list
  const sortedList = sortParticipants(participants, sortOrder);

  // Friendly text for sort order
  const sortLabels = {
    'name-asc': 'Student Name (A to Z)',
    'name-desc': 'Student Name (Z to A)',
    'email-asc': 'Student Email (A to Z)',
    'date-asc': 'Registration Date (Oldest First)',
    'date-desc': 'Registration Date (Newest First)'
  };
  const activeSortLabel = sortLabels[sortOrder] || 'Student Name (A to Z)';

  // 2. Header Section
  doc.setFillColor(30, 64, 175); // #1e40af Primary collegiate blue
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COLLEGE EVENT REGISTRATION PORTAL', 40, 34);

  // Sub-header title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('OFFICIAL REGISTERED PARTICIPANTS REPORT', 40, 85);

  // Metadata Card Box
  doc.setFillColor(248, 250, 252); // #f8fafc light gray
  doc.setDrawColor(226, 232, 240); // #e2e8f0 border
  doc.roundedRect(40, 98, pageWidth - 80, 88, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 64, 175);
  doc.text(event?.eventTitle || 'College Event', 52, 118);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const formattedEventDate = event?.eventDate
    ? new Date(event.eventDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'N/A';

  doc.text(`Category: ${event?.category || 'General'}`, 52, 134);
  doc.text(`Event Date: ${formattedEventDate}`, 52, 148);
  doc.text(`Venue: ${event?.venue || 'Campus Venue'}`, 52, 162);

  doc.text(`Organizer: ${event?.organizer || 'College Department'}`, 300, 134);
  doc.text(
    `Total Registered: ${sortedList.length} / Max Seats: ${event?.maximumParticipants || 'N/A'}`,
    300,
    148
  );
  doc.text(`Report Sorted By: ${activeSortLabel}`, 300, 162);

  // Generation timestamp
  const now = new Date();
  const timestampStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated on: ${timestampStr}`, pageWidth - 40, 85, { align: 'right' });

  // 3. Table of Registered Students
  const tableRows = sortedList.map((p, index) => {
    const regDateStr = p.registrationDate
      ? new Date(p.registrationDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : 'N/A';

    return [
      index + 1,
      p.studentName || 'N/A',
      p.studentEmail || 'N/A',
      p.userId || p.registrationId || '-',
      regDateStr,
      p.participationStatus || 'Registered'
    ];
  });

  autoTable(doc, {
    startY: 200,
    head: [['#', 'Student Name', 'Email Address', 'Student ID', 'Registered On', 'Status']],
    body: tableRows.length > 0 ? tableRows : [['-', 'No participants registered', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [15, 23, 42],
      rowPageBreak: 'avoid'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 28, halign: 'center' },
      1: { cellWidth: 120, fontStyle: 'bold' },
      2: { cellWidth: 150 },
      3: { cellWidth: 80, fontStyle: 'italic', textColor: [100, 116, 139] },
      4: { cellWidth: 80 },
      5: { cellWidth: 55, halign: 'center' }
    },
    margin: { left: 40, right: 40 },
    didDrawPage: (data) => {
      // Footer with page numbering
      const str = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'College Event Registration Portal * Confidential Academic Record',
        40,
        pageHeight - 20
      );
      doc.text(str, pageWidth - 40, pageHeight - 20, { align: 'right' });
    }
  });

  // 4. Download PDF
  const cleanTitle = (event?.eventTitle || 'Event')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 30);
  doc.save(`${cleanTitle}_Participants_Report.pdf`);
};
