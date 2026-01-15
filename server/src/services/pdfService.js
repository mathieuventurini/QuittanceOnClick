const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Generates a PDF receipt
 * @param {Object} data - Receipt data (tenant, address, amount, period)
 * @returns {Promise<Buffer>} - The generated PDF as a buffer
 */
const generateReceipt = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                let pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Header
            doc.fontSize(20).text('QUITTANCE DE LOYER', { align: 'center' });
            doc.moveDown();

            // Period
            doc.fontSize(12).text(`Période : ${data.period}`, { align: 'right' });
            doc.moveDown();

            // Owner Info (Hardcoded for MVP or passed in)
            doc.fontSize(12).text('Bailleur :', { underline: true });
            doc.text('Mathieu Venturini'); // You might want to make this dynamic
            doc.moveDown();

            // Tenant Info
            doc.text('Locataire :', { underline: true });
            doc.text(data.tenantName);
            doc.text(data.address);
            doc.moveDown(2);

            // Details
            doc.fontSize(14).text('Détail du paiement', { underline: true });
            doc.moveDown();

            const tableTop = doc.y;
            const itemX = 50;
            const amountX = 400;

            doc.fontSize(12).text('Loyer + Charges', itemX, tableTop);
            doc.text(`${data.amount} €`, amountX, tableTop);

            doc.moveDown(2);

            doc.fontSize(12).text(`Je soussigné Mathieu Venturini, reconnait avoir reçu la somme de ${data.amount} euros en paiement du loyer et des charges pour la période du ${data.period}.`);
            doc.moveDown();

            doc.text(`Fait à _________________, le ${new Date().toLocaleDateString('fr-FR')}`);

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateReceipt };
