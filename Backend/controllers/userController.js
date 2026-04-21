import { pool } from "../libs/database.js";
import { hashPassword, comparePassword } from "../libs/index.js";

export const getUser = async (req, res) => {
    try {
            const { userId } = req.user;
            const userExist = await pool.query({
                text: 'SELECT * FROM tbluser WHERE id = $1',
                values: [userId]
            });
            if (!userExist.rows.length) {
                return res.status(404).json({ message: 'User not found' });
            }
            const user = userExist.rows[0];
            delete user.password;
            return res.status(200).json({ message: 'User retrieved successfully', user });
    } catch (error) {
        console.log("Error in getUser:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const changepassword = async (req, res) => {
    try {
        const { userId } = req.user;

        const { currentPassword, newPassword, confirmPassword } = req.body;

        const userExist = await pool.query({
            text: 'SELECT * FROM tbluser WHERE id = $1',
            values: [userId]
        });
        if (!userExist.rows.length) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if(newPassword!==confirmPassword){
            return res.status(400).json({ message: 'New passwords do not match' });
        }   
        const isMatch = await comparePassword(currentPassword, userExist.rows[0].password); 

        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        const hashedPassword = await hashPassword(newPassword);

        await pool.query({
            text: 'UPDATE tbluser SET password = $1 WHERE id = $2',
            values: [hashedPassword, userId]
        });
        return res.status(200).json({ message: 'Password updated successfully' });
        
    } catch (error) {   
        console.log("Error in changepassword:", error);
        return res.status(500).json({ message: 'Internal server error' });
    } 
};

export const updateUser = async (req, res) => {
    try {
        // 🔐 Get user from token
        const { userId } = req.user;

        // 📥 Get data from request body
        const { firstName, lastName, country, currency, contact } = req.body;

        // ✅ Validate input
        if (!firstName || !lastName || !country || !currency || !contact) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // 🔍 Check if user exists
        const userExist = await pool.query({
            text: "SELECT * FROM tbluser WHERE id = $1",
            values: [userId]
        });

        if (!userExist.rows.length) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // ✏️ Update user
  const updatedUser = await pool.query({
    text: `
        UPDATE tbluser 
        SET firstname = $1,
            lastname = $2,
            country = $3,
            currency = $4,
            contact = $5
        WHERE id = $6
        RETURNING *
    `,
    values: [firstName, lastName, country, currency, contact, userId]
});

        // ⚠️ Safety check
        if (!updatedUser.rows.length) {
            return res.status(400).json({
                message: "Update failed"
            });
        }

        // 🔒 Remove password before sending response
        const user = updatedUser.rows[0];
        delete user.password;

        // ✅ Success response
        return res.status(200).json({
            message: "User updated successfully",
            user
        });

    } catch (error) {
        console.log("Error in updateUser:", error); // 🔥 VERY IMPORTANT FOR DEBUG
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

