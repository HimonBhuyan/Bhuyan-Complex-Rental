const PDFDocument = require('pdfkit');

class PDFService {
  static async generateBillInvoice(bill, tenant, room) {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Add header
    this.addHeader(doc, bill);
    
    // Add tenant and room details
    this.addTenantDetails(doc, tenant, room, bill);
    
    // Add bill breakdown table
    this.addBillBreakdown(doc, bill);
    
    // Add payment status and notes
    this.addPaymentStatus(doc, bill);
    
    // Add footer
    this.addFooter(doc);

    return doc;
  }

  static addHeader(doc, bill) {
    const pageWidth = doc.page.width;
    
    // Company name and logo area
    doc.fontSize(24)
       .fillColor('#2563eb')
       .text('Bhuyan Complex', 50, 50, { align: 'left' });
    
    // Add a placeholder for logo (you can replace this with actual logo later)
    doc.rect(pageWidth - 150, 40, 80, 60)
       .stroke('#cccccc');
    doc.fontSize(8)
       .fillColor('#666666')
       .text('LOGO', pageWidth - 125, 65, { align: 'center' });

    // Invoice title
    doc.fontSize(18)
       .fillColor('#333333')
       .text('RENTAL INVOICE', 50, 90);
    
    // Invoice details in top right
    doc.fontSize(10)
       .text(`Invoice #: ${bill.billNumber}`, pageWidth - 200, 100)
       .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 200, 115)
       .text(`Due Date: ${bill.dueDate.toLocaleDateString('en-IN')}`, pageWidth - 200, 130);

    // Add a line separator
    doc.moveTo(50, 160)
       .lineTo(pageWidth - 50, 160)
       .strokeColor('#e5e7eb')
       .stroke();

    return 180; // Return next Y position
  }

  static addTenantDetails(doc, tenant, room, bill) {
    let yPos = 180;
    
    // Billing period
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const billingPeriod = `${monthNames[bill.month - 1]} ${bill.year}`;
    
    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('BILLING PERIOD', 50, yPos)
       .fontSize(14)
       .fillColor('#059669')
       .text(billingPeriod, 50, yPos + 15);

    // Tenant details
    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('BILL TO:', 50, yPos + 50)
       .fontSize(10)
       .fillColor('#374151')
       .text(`${tenant.name}`, 50, yPos + 70)
       .text(`${tenant.email}`, 50, yPos + 85)
       .text(`${tenant.phone}`, 50, yPos + 100)
       .text(`Room: ${room ? room.roomNumber : 'N/A'}`, 50, yPos + 115);

    // Property details (right side)
    const pageWidth = doc.page.width;
    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('PROPERTY DETAILS:', pageWidth - 250, yPos + 50)
       .fontSize(10)
       .fillColor('#374151')
       .text('Bhuyan Complex', pageWidth - 250, yPos + 70)
       .text('Property Management Office', pageWidth - 250, yPos + 85)
       .text('Contact: admin@bhuyancomplex.com', pageWidth - 250, yPos + 100)
       .text('Phone: +91 XXXXX XXXXX', pageWidth - 250, yPos + 115);

    return yPos + 150;
  }

  static addBillBreakdown(doc, bill) {
    let yPos = 350;
    const pageWidth = doc.page.width;
    
    // Table header
    doc.fontSize(12)
       .fillColor('#1f2937')
       .text('BILL BREAKDOWN', 50, yPos);
    
    yPos += 30;
    
    // Table headers
    doc.rect(50, yPos, pageWidth - 100, 25)
       .fillAndStroke('#f3f4f6', '#e5e7eb');
    
    doc.fontSize(10)
       .fillColor('#374151')
       .text('Description', 60, yPos + 8)
       .text('Amount (₹)', pageWidth - 150, yPos + 8);
    
    yPos += 25;
    
    // Bill items
    const items = [];
    
    // Add rent
    if (bill.items.rent && bill.items.rent.amount > 0) {
      items.push({
        description: bill.items.rent.description || 'Monthly Rent',
        amount: bill.items.rent.amount
      });
    }
    
    // Add electricity
    if (bill.items.electricity && bill.items.electricity.amount > 0) {
      const unitsText = bill.items.electricity.unitsConsumed 
        ? ` (${bill.items.electricity.unitsConsumed} units @ ₹${bill.items.electricity.chargesPerUnit}/unit)`
        : '';
      items.push({
        description: `Electricity Bill${unitsText}`,
        amount: bill.items.electricity.amount
      });
    }
    
    // Add water bill
    if (bill.items.waterBill && bill.items.waterBill.amount > 0) {
      items.push({
        description: bill.items.waterBill.description || 'Water Bill',
        amount: bill.items.waterBill.amount
      });
    }
    
    // Add common area charges
    if (bill.items.commonAreaCharges && bill.items.commonAreaCharges.amount > 0) {
      items.push({
        description: bill.items.commonAreaCharges.description || 'Common Area Maintenance',
        amount: bill.items.commonAreaCharges.amount
      });
    }
    
    // Add additional charges
    if (bill.items.additionalCharges && bill.items.additionalCharges.length > 0) {
      bill.items.additionalCharges.forEach(charge => {
        items.push({
          description: charge.description,
          amount: charge.amount
        });
      });
    }
    
    // Render items
    items.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
      doc.rect(50, yPos, pageWidth - 100, 20)
         .fillAndStroke(bgColor, '#f3f4f6');
      
      doc.fontSize(9)
         .fillColor('#374151')
         .text(item.description, 60, yPos + 6)
         .text(`₹${item.amount.toLocaleString('en-IN')}`, pageWidth - 150, yPos + 6);
      
      yPos += 20;
    });
    
    // Subtotal
    doc.rect(50, yPos, pageWidth - 100, 25)
       .fillAndStroke('#f3f4f6', '#e5e7eb');
    
    doc.fontSize(10)
       .fillColor('#1f2937')
       .text('Subtotal', 60, yPos + 8)
       .text(`₹${bill.totalAmount.toLocaleString('en-IN')}`, pageWidth - 150, yPos + 8);
    
    yPos += 25;
    
    // Calculate and add penalty if applicable
    const currentDate = new Date();
    let penaltyAmount = 0;
    let daysOverdue = 0;
    
    if (bill.status !== 'paid' && bill.dueDate < currentDate) {
      daysOverdue = Math.ceil((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24));
      const penaltyPerDay = bill.totalAmount * 0.01;
      penaltyAmount = Math.min(daysOverdue * penaltyPerDay, bill.totalAmount * 0.25);
      penaltyAmount = Math.round(penaltyAmount);
    }
    
    if (penaltyAmount > 0) {
      doc.rect(50, yPos, pageWidth - 100, 20)
         .fillAndStroke('#fef2f2', '#fecaca');
      
      doc.fontSize(9)
         .fillColor('#dc2626')
         .text(`Late Payment Penalty (${daysOverdue} days overdue)`, 60, yPos + 6)
         .text(`₹${penaltyAmount.toLocaleString('en-IN')}`, pageWidth - 150, yPos + 6);
      
      yPos += 20;
    }
    
    // Total amount
    const totalAmount = bill.totalAmount + penaltyAmount;
    doc.rect(50, yPos, pageWidth - 100, 30)
       .fillAndStroke('#059669', '#059669');
    
    doc.fontSize(12)
       .fillColor('#ffffff')
       .text('TOTAL AMOUNT', 60, yPos + 10)
       .fontSize(14)
       .text(`₹${totalAmount.toLocaleString('en-IN')}`, pageWidth - 150, yPos + 8);
    
    return yPos + 50;
  }

  static addPaymentStatus(doc, bill) {
    let yPos = 580;
    const pageWidth = doc.page.width;
    
    // Payment status
    const statusColor = bill.status === 'paid' ? '#059669' : 
                       bill.status === 'overdue' ? '#dc2626' : '#d97706';
    const statusBg = bill.status === 'paid' ? '#f0fdf4' : 
                    bill.status === 'overdue' ? '#fef2f2' : '#fef3c7';
    
    doc.rect(50, yPos, 200, 30)
       .fillAndStroke(statusBg, statusColor);
    
    doc.fontSize(11)
       .fillColor(statusColor)
       .text('PAYMENT STATUS', 60, yPos + 5)
       .fontSize(12)
       .text(bill.status.toUpperCase().replace('_', ' '), 60, yPos + 18);
    
    // Payment details (if paid)
    if (bill.status === 'paid' && bill.paidDate) {
      doc.fontSize(10)
         .fillColor('#374151')
         .text(`Paid on: ${bill.paidDate.toLocaleDateString('en-IN')}`, 270, yPos + 8);
      
      if (bill.transactionId) {
        doc.text(`Transaction ID: ${bill.transactionId}`, 270, yPos + 22);
      }
    }
    
    return yPos + 50;
  }

  static addFooter(doc) {
    const pageHeight = doc.page.height;
    const pageWidth = doc.page.width;
    
    // Footer line
    doc.moveTo(50, pageHeight - 100)
       .lineTo(pageWidth - 50, pageHeight - 100)
       .strokeColor('#e5e7eb')
       .stroke();
    
    // Footer text
    doc.fontSize(9)
       .fillColor('#6b7280')
       .text('Thank you for choosing Bhuyan Complex!', 50, pageHeight - 80, { align: 'center' })
       .text('For any queries, please contact us at admin@bhuyancomplex.com', 50, pageHeight - 65, { align: 'center' })
       .text('This is a computer-generated invoice and does not require a signature.', 50, pageHeight - 50, { align: 'center' });
  }
}

module.exports = PDFService;