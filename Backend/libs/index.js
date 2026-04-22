import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


export const hashPassword = async (password) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

export const comparePassword = async (password, hashedPassword) => {
    try {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        return isMatch;
    } catch (error) {
        console.error("Error comparing passwords:", error);
        throw error; // Rethrow the error to be handled by the caller
    }
}

export const createJWT = (id) => {
  return jwt.sign(
    { userId: id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }   // 1 day
  );
};

export const getMonthName = (monthIndex) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthIndex] || 'Invalid Month';
};