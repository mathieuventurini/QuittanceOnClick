const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const dataBuffer = fs.readFileSync('../quittance_loyer_janvier_2026.pdf');

async function extract() {
    try {
        const parser = new PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        console.log("--- START TEXT ---");
        console.log(result.text);
        console.log("--- END TEXT ---");
        await parser.destroy();
    } catch (e) {
        console.error(e);
    }
}

extract();
