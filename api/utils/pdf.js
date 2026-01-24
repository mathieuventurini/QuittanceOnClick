import PDFDocument from 'pdfkit';

export const generateReceiptBuffer = (data) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // --- Data Handling ---
        const ownerName = process.env.OWNER_NAME || 'Anne Funfschilling';
        const tenantName = data.tenantName || 'Justine Chartrain';
        const address = data.address || '10 Rue de la Pierre, Bâtiment B, Appartement B01\n37100 Tours';
        const fullAmount = data.amount || 715;

        // Hardcoded breakdown logic (if 715, split 670/45, else all rent)
        let rentAmount = fullAmount;
        let chargesAmount = 0;
        if (parseFloat(fullAmount) === 715) {
            rentAmount = 670;
            chargesAmount = 45;
        }

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('fr-FR');

        // Compute period dates (assuming data.period is "Janvier 2026" or similar)
        // We need explicit dates like "01/01/2026"
        const periodStr = data.period || 'Janvier 2026'; // e.g. "Janvier 2026"
        // Try to parse month/year from period string
        const periodParts = periodStr.split(' '); // ["Janvier", "2026"]
        let monthName = periodParts[0] || 'Janvier';
        let year = periodParts[1] || '2026';

        // Mapping French months to index
        const months = {
            'Janvier': '01', 'Février': '02', 'Mars': '03', 'Avril': '04', 'Mai': '05', 'Juin': '06',
            'Juillet': '07', 'Août': '08', 'Septembre': '09', 'Octobre': '10', 'Novembre': '11', 'Décembre': '12'
        };
        const monthNum = months[monthName] || '01';
        const lastDayMap = {
            '01': 31, '02': 28, '03': 31, '04': 30, '05': 31, '06': 30,
            '07': 31, '08': 31, '09': 30, '10': 31, '11': 30, '12': 31
        };
        // Leap year check simplified
        if (monthNum === '02' && (year % 4 === 0)) lastDayMap['02'] = 29;
        const lastDay = lastDayMap[monthNum];

        const periodStart = `01/${monthNum}/${year}`;
        const periodEnd = `${lastDay}/${monthNum}/${year}`;
        const periodLong = `du 1er au ${lastDay} ${monthName.toLowerCase()} ${year}`;

        // --- PDF Content ---

        // Title
        doc.font('Helvetica-Bold').fontSize(16).text('QUITTANCE DE LOYER', { align: 'center' });
        doc.moveDown(2);

        // Period
        doc.font('Helvetica').fontSize(11).text(`Période : du ${periodStart} au ${periodEnd}`);
        doc.moveDown(1);

        // Parties
        doc.font('Helvetica-Bold').text(`Bailleur : ${ownerName}`);
        doc.text(`Locataire : ${tenantName}`);

        // Address (Regular font)
        doc.font('Helvetica').text(address);
        doc.moveDown(2);

        // Body Text
        const bodyText = `Je soussigné(e) ${ownerName}, propriétaire du logement situé au ${address.replace('\n', ', ')}, déclare avoir reçu de la part de ${tenantName} la somme de ${parseFloat(fullAmount).toFixed(2).replace('.', ',')} € au titre du loyer et des charges pour la période d’occupation ${periodLong}.`;

        doc.text(bodyText, { align: 'justify', lineGap: 4 });
        doc.moveDown(2);

        // Details
        doc.font('Helvetica-Bold').text('Détail du règlement :');
        doc.font('Helvetica');
        doc.text(`Loyer net hors charges : ${parseFloat(rentAmount).toFixed(2).replace('.', ',')} €`);
        doc.text(`Provisions pour charges : ${parseFloat(chargesAmount).toFixed(2).replace('.', ',')} €`);
        doc.font('Helvetica-Bold').text(`Montant total reçu : ${parseFloat(fullAmount).toFixed(2).replace('.', ',')} €`);

        // Amount in words (simplified/hardcoded for 715)
        let amountInWords = 'Sept cent quinze euros';
        if (parseFloat(fullAmount) !== 715) {
            amountInWords = '...'; // Placeholder if dynamic
        }



        // Disclaimer
        doc.fontSize(10).text('Cette quittance annule tout reçu relatif à la période susmentionnée et ne peut servir de quittance pour les termes précédents.', { align: 'left' });
        doc.moveDown(2);

        // Footer / Signature
        doc.fontSize(11).text(`Fait à Tours, le ${formattedDate}.`, { align: 'right' });
        doc.moveDown(0.5);
        doc.text('Signature du bailleur :', { align: 'right' });
        doc.moveDown(1);
        doc.text('______________________________', { align: 'right' });

        doc.end();
    });
};
