import { generateReceiptBuffer } from './utils/pdf.js';
import fs from 'fs';

async function run() {
    process.env.OWNER_NAME = 'Anne Funfschilling';
    const data = {
        tenantName: 'Justine Chartrain',
        amount: 715,
        address: '10 Rue de la Pierre, Bâtiment B, Appartement B01\n37100 Tours',
        period: 'Janvier 2026'
    };

    try {
        const buffer = await generateReceiptBuffer(data);
        fs.writeFileSync('../sample_receipt.pdf', buffer);
        console.log('Sample PDF generated at ../sample_receipt.pdf');
    } catch (e) {
        console.error(e);
    }
}

run();
