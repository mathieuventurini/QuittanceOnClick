import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const SECRET = process.env.JWT_SECRET;
const PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Checks if the request is authenticated via cookie.
 */
export const isAuthenticated = (req) => {
    if (!req.cookies || !req.cookies.token) return false;
    try {
        jwt.verify(req.cookies.token, SECRET);
        return true;
    } catch (err) {
        return false;
    }
};

/**
 * Sets the authentication cookie on the response.
 */
export const setAuthCookie = (res) => {
    const token = jwt.sign({ role: 'admin' }, SECRET, { expiresIn: '7d' });
    const cookieValue = serialize('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'strict',
        path: '/',
    });
    res.setHeader('Set-Cookie', cookieValue);
};

export const checkPassword = (inputPassword) => {
    return inputPassword === PASSWORD;
};
