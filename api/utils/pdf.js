import PDFDocument from 'pdfkit';

export const generateReceiptBuffer = (data) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // --- PDF Content ---
        doc.fontSize(20).text('QUITTANCE DE LOYER', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Date : ${data.date}`);
        doc.text(`Période : ${data.period}`);
        doc.moveDown();

        doc.text(`Propriétaire : ${process.env.OWNER_NAME || 'Mathieu Venturini'}`);
        doc.text(`Locataire : ${data.tenantName}`);
        doc.moveDown();

        doc.text(`Adresse du bien :`);
        doc.text(data.address);
        doc.moveDown();

        doc.text(`Je soussigné certifie avoir reçu la somme de ${data.amount}€ pour le loyer et les charges.`);
        doc.text(`Cette quittance annule tous les reçus qui auraient pu être donnés pour acompte sur la présente période.`);
        doc.moveDown(2);

        doc.text('Fait pour valoir ce que de droit.', { align: 'right' });

        doc.end();
    });
};
