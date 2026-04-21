import { pool } from '../libs/database.js';
import { hashPassword, comparePassword, createJWT } from '../libs/index.js';

export const signupUser = async (req, res) => {
    try {
        const { firstName, email, password } = req.body;

        console.log("Received sign-up data:", { firstName, email });

        // ✅ validation
        if (!firstName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // ✅ check existing user
        const userExist = await pool.query({
            text: 'SELECT EXISTS (SELECT 1 FROM tbluser WHERE email = $1)',
            values: [email]
        });

        if (userExist.rows[0].exists) {
            return res.status(400).json({
                message: 'Email already exists. Try logging in.'
            });
        }

        // ✅ hash password
        const hashedPassword = await hashPassword(password);

        // ✅ insert user
        const result = await pool.query({
            text: `INSERT INTO tbluser (firstname, email, password)
                   VALUES ($1, $2, $3) RETURNING *`,
            values: [firstName, email, hashedPassword],
        });

        const user = result.rows[0];
        delete user.password; // better than undefined

        return res.status(201).json({
            message: 'User registered successfully',
            user
        });

    } catch (error) {
        console.log("Error in signupUser:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const signinUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("Received sign-in data:", { email });

        // ✅ FIRST validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // ✅ find user
        const result = await pool.query({
            text: 'SELECT * FROM tbluser WHERE email = $1',
            values: [email]
        });

        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        // ✅ compare password
        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        // ✅ create token
        const token = createJWT(user.id);

        delete user.password;

        return res.status(200).json({
            message: 'User signed in successfully',
            user,
            token
        });

    } catch (error) {
        console.log("Error in signinUser:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};