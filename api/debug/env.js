export default function handler(req, res) {
    const check = (name) => process.env[name] ? '✅ Set' : '❌ MISSING';

    const report = {
        _NOTE: "Do not share valid keys screenshots publicly. Only report MISSING ones.",
        RESEND_API_KEY: check('RESEND_API_KEY'),
        TENANT_EMAIL: check('TENANT_EMAIL'),
        TENANT_NAME: check('TENANT_NAME'),
        PROPERTY_ADDRESS: check('PROPERTY_ADDRESS'),
        RENT_AMOUNT: check('RENT_AMOUNT'),
        KV_REST_API_URL: check('KV_REST_API_URL'),
        KV_REST_API_TOKEN: check('KV_REST_API_TOKEN'),
        OWNER_NAME: check('OWNER_NAME')
    };

    res.status(200).json(report);
}
