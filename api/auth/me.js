import { isAuthenticated } from '../utils/auth.js';

export default function handler(req, res) {
    if (isAuthenticated(req)) {
        return res.status(200).json({ authenticated: true });
    } else {
        // Return 200 with authenticated: false so frontend can handle it gracefully
        return res.status(200).json({ authenticated: false });
    }
}
