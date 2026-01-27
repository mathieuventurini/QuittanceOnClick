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

        // Parse period string (Expected format: "Janvier 2026" or "27 Janvier 2026")
        // We want to extract the Month and Year.
        // If data.period is "27 janvier 2026", split by space.
        let periodStr = data.period || 'Janvier 2026';
        let periodParts = periodStr.split(' ').filter(p => p.trim() !== '');

        // Dictionary for Month Name -> Number
        const monthsMap = {
            'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04', 'mai': '05', 'juin': '06',
            'juillet': '07', 'août': '08', 'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
        };

        // Heuristic: If 3 parts (Day, Month, Year), take index 1 and 2. If 2 parts, take 0 and 1.
        let monthName = '';
        let year = '';

        if (periodParts.length >= 3) {
            monthName = periodParts[1];
            year = periodParts[2];
        } else if (periodParts.length === 2) {
            monthName = periodParts[0];
            year = periodParts[1];
        } else {
            // Fallback
            monthName = 'Janvier';
            year = '2026';
        }

        // Normalize month name (lowercase for lookup, keep original for display if needed but we usually capitalize it)
        const monthKey = monthName.toLowerCase();
        const monthNum = monthsMap[monthKey] || '01';

        // --- Dynamic Last Day Calculation ---
        // JS Date: new Date(year, monthIndex, 0) returns the last day of the PREVIOUS month. 
        // So passed monthNum is 1-based string. 
        // Example: Jan=1. new Date(2026, 1, 0) -> Feb 0th -> Jan 31st. Correct.
        const lastDayObj = new Date(parseInt(year), parseInt(monthNum), 0);
        const lastDay = lastDayObj.getDate();

        const periodStart = `01/${monthNum}/${year}`;
        const periodEnd = `${lastDay}/${monthNum}/${year}`;

        // Capitalize month for text
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase();
        const periodLong = `du 1er au ${lastDay} ${capitalizedMonth.toLowerCase()} ${year}`;

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
        // CORRECTION: "Je soussignée" instead of "Je soussigné(e)"
        const bodyText = `Je soussignée ${ownerName}, propriétaire du logement situé au ${address.replace('\n', ', ')}, déclare avoir reçu de la part de ${tenantName} la somme de ${parseFloat(fullAmount).toFixed(2).replace('.', ',')} € au titre du loyer et des charges pour la période d’occupation ${periodLong}.`;

        doc.text(bodyText, { align: 'justify', lineGap: 4 });
        doc.moveDown(2);

        // Details
        doc.font('Helvetica-Bold').text('Détail du règlement :');
        doc.moveDown(0.5); // Add a little space before items
        doc.font('Helvetica');

        // Improved spacing using lineGap or moveDown
        doc.text(`Loyer net hors charges : ${parseFloat(rentAmount).toFixed(2).replace('.', ',')} €`, { lineGap: 5 });
        doc.text(`Provisions pour charges : ${parseFloat(chargesAmount).toFixed(2).replace('.', ',')} €`, { lineGap: 5 });
        doc.font('Helvetica-Bold').text(`Montant total reçu : ${parseFloat(fullAmount).toFixed(2).replace('.', ',')} €`);

        // Amount in words (simplified/hardcoded for 715)
        let amountInWords = 'Sept cent quinze euros';
        if (parseFloat(fullAmount) !== 715) {
            amountInWords = '...'; // Placeholder if dynamic
        }

        doc.moveDown(2);

        // Disclaimer
        doc.font('Helvetica-Oblique').fontSize(9).text('Cette quittance annule tout reçu relatif à la période susmentionnée et ne peut servir de quittance pour les termes précédents.', { align: 'left' });
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
