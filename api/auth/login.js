import { checkPassword, setAuthCookie } from '../utils/auth.js';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { password } = req.body;

    if (checkPassword(password)) {
        setAuthCookie(res);
        return res.status(200).json({ success: true });
    } else {
        return res.status(401).json({ error: 'Invalid password' });
    }
}
