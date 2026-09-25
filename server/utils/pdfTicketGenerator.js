const PDFDocument = require('pdfkit');

/**
 * Generates an elegant Event Registration Pass / Ticket PDF Buffer
 * @param {Object} event - Event details
 * @param {Object} student - Student details
 * @param {Object} registration - Registration details
 * @returns {Promise<Buffer>}
 */
const generateEventTicketPDF = (event, student, registration) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header Banner (Primary Blue #1E40AF)
      doc.rect(40, 40, 515, 60).fill('#1E40AF');

      doc.fillColor('#FFFFFF');
      doc.font('Helvetica-Bold').fontSize(16).text('COLLEGE EVENT REGISTRATION PORTAL', 60, 52);
      doc.font('Helvetica').fontSize(10).text('OFFICIAL REGISTRATION CONFIRMATION PASS', 60, 74);

      // Status Badge on Right
      doc.rect(435, 54, 100, 28).fill('#15803D'); // Success Green
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10).text('CONFIRMED', 450, 62);

      // Ticket ID & Issue Date
      doc.fillColor('#64748B').font('Helvetica').fontSize(9).text(
        `Ticket ID: ${registration.registrationId || registration._id}`,
        40,
        115
      );
      const regDate = registration.registrationDate
        ? new Date(registration.registrationDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })
        : new Date().toLocaleDateString('en-US');
      doc.text(`Issued On: ${regDate}`, 430, 115, { align: 'right' });

      // Event Details Box
      doc.rect(40, 135, 515, 140).fillAndStroke('#F8FAFC', '#E2E8F0');

      doc.fillColor('#1E40AF').font('Helvetica-Bold').fontSize(15).text(event.eventTitle || 'College Event', 60, 150);
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(10).text(`Category: ${event.category || 'General'}`, 60, 172);

      const eventDateStr = event.eventDate
        ? new Date(event.eventDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'TBA';

      doc.font('Helvetica').fontSize(10).fillColor('#0F172A');
      doc.text(`Date: ${eventDateStr}`, 60, 195);
      doc.text(`Venue: ${event.venue || 'Campus Auditorium'}`, 60, 215);
      doc.text(`Organizer: ${event.organizer || 'College Department'}`, 60, 235);

      // Student / Attendee Information Box
      doc.rect(40, 295, 515, 120).fillAndStroke('#FFFFFF', '#CBD5E1');

      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('ATTENDEE DETAILS', 60, 310);

      doc.font('Helvetica-Bold').fontSize(10).fillColor('#475569');
      doc.text('Student Name:', 60, 335);
      doc.text('College Email:', 60, 355);
      doc.text('Student ID:', 60, 375);

      doc.font('Helvetica').fontSize(10).fillColor('#0F172A');
      doc.text(student.name || 'Student', 160, 335);
      doc.text(student.email || 'N/A', 160, 355);
      doc.text(student.userId || student._id || 'N/A', 160, 375);

      // Instructions Section
      doc.rect(40, 435, 515, 110).fillAndStroke('#FEF3C7', '#FDE68A'); // Light Amber
      doc.fillColor('#92400E').font('Helvetica-Bold').fontSize(10).text('IMPORTANT INSTRUCTIONS:', 55, 450);

      doc.font('Helvetica').fontSize(9).fillColor('#78350F');
      doc.text('1. Please carry a printed copy of this pass or keep it accessible on your mobile device.', 55, 470);
      doc.text('2. Present your valid College Student ID Card at the registration desk upon arrival.', 55, 485);
      doc.text('3. Please arrive at the venue at least 15 minutes before the scheduled start time.', 55, 500);
      doc.text('4. If you cannot attend, please cancel your registration in the portal to free the seat.', 55, 515);

      // Footer
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(8).text(
        'College Event Registration Portal * Verified Electronic Document',
        40,
        580,
        { align: 'center', width: 515 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateEventTicketPDF };
