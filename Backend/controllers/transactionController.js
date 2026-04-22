import { pool } from "../libs/database.js";
import{getMonthName} from "../libs/index.js";

export const getTransactions = async (req, res) => {
    try {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD

        const { df, dt, s } = req.query;

        const { userId } = req.user; // User ID from JWT token via authMiddleware   
        const startDate = new Date(df || sevenDaysAgoString);
        const endDate = new Date(dt || today);

        endDate.setHours(23, 59, 59, 999);

        let query = 'SELECT * FROM tbltransaction WHERE user_id = $1 AND createdAt BETWEEN $2 AND $3';
let values = [userId, startDate, endDate];

if (s && s.trim() !== "") {
  query += ' AND (description ILIKE $4 OR source ILIKE $4)';
  values.push(`%${s}%`);
}

query += ' ORDER BY id DESC';

const transactions = await pool.query(query, values);
        res.status(200).json({ transactions: transactions.rows });
    } catch (error) {
        res.status(500).json({ message: 'Error getting transactions', error: error.message });
    }
}

export const deleteTransaction = async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;
        const result = await pool.query('DELETE FROM tbltransaction WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting transaction', error: error.message });
    }
}

export const addTransaction = async (req, res) => {
    try {
        const { userId } = req.user;
        const { account_id } = req.params;
        const { description, type, status, amount, source } = req.body;

        if (!description || !type || !status || !amount || !source) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (Number(amount) <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }

        const result = await pool.query('SELECT * FROM tblaccount WHERE id = $1', [account_id]);
        const account = result.rows[0];
        if (!account) {
            return res.status(404).json({ message: 'Invalid account information' });
        }

        if (
            account.account_balance < 0 || account.account_balance < Number(amount)
        ) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        await pool.query("BEGIN");

        await pool.query('UPDATE tblaccount SET account_balance = account_balance - $1 WHERE id = $2 RETURNING *', [amount, account_id]);

        const transactionResult = await pool.query('INSERT INTO tbltransaction (user_id, account_id, description, type, status, source, amount) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [userId, account_id, description, type, status, source, amount]);

        await pool.query('COMMIT');

        res.status(201).json({ message: 'Transaction added successfully', transaction: transactionResult.rows[0] });
    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ message: 'Error adding transaction', error: error.message });
    }
}

export const getDashboardInformation = async (req, res) => {
    try {
        const { userId } = req.user;

        let totalIncome=0;
        let totalExpense=0;

        const transactionResult = await pool.query({
            text: 'SELECT type ,sum(amount) as totalAmount FROM tbltransaction WHERE user_id = $1 GROUP BY type',
            values: [userId],
        });

        const transactiona=transactionResult.rows;

        transactiona.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += Number(transaction.totalAmount || transaction.totalamount);
            } else if (transaction.type === 'expense') {
                totalExpense += Number(transaction.totalAmount || transaction.totalamount);
            }
        });

        const availableBalance = totalIncome - totalExpense;

        //aggregate transactions to sum by type and group by month
        const year=new Date().getFullYear();
        const start_Date=new Date(year,0,1);//jan 1st
        const end_Date=new Date(year,11,31,23,59,59 );//december 31st

        const result=await pool.query({
            text: `SELECT type,EXTRACT(MONTH FROM createdAt) AS month, SUM(amount) AS total_amount
            FROM tbltransaction
            WHERE user_id = $1 AND createdAt BETWEEN $2 AND $3
            GROUP BY 
            Extract(MONTH FROM createdAt), type`,
            values: [userId, start_Date, end_Date],
        });

        //organise data

        const data=new Array(12).fill().map((_, index) => {
            const monthData=result.rows.filter((item) =>parseInt(item.month) === index + 1);
            
            const income=monthData.find((item) => item.type === 'income')?.total_amount || 0;

            const expense=monthData.find((item) => item.type === 'expense')?.total_amount || 0;

            return {
                label:getMonthName(index),
                income: Number(income),
                expense: Number(expense),
            };
        });
        //fetch last transaction
        const lastTransactionResult=await pool.query({
            text:'SELECT * FROM tbltransaction WHERE user_id = $1 ORDER BY createdAt DESC LIMIT 5',
            values:[userId],
        });

        const lastTransactions=lastTransactionResult.rows;
        //fetch last accounts
        const lastAccountsResult=await pool.query({
            text:'SELECT * FROM tblaccount WHERE user_id = $1 ORDER BY createdAt DESC LIMIT 5',
            values:[userId],
        });
        const lastAccounts=lastAccountsResult.rows;

        res.status(200).json({
            totalIncome,
            totalExpense,
            availableBalance,
            chartData:data,
            lastTransactions,
            lastAccounts,
        });

    } catch (error) {
        res.status(500).json({ message: 'Error getting dashboard information', error: error.message });
    }
}

export const transferMoneyToAccount = async (req, res) => {
    try {
        const { userId } = req.user;
        const { from_account, to_account, amount } = req.body;


        if(!from_account || !to_account || !amount){
            return res.status(400).json({ message: 'provide  required fields' });
        }

        const newAmount = Number(amount);
        if (newAmount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }
//check account details and balance for 'from account'
        const fromAccountResult = await pool.query(
            'SELECT * FROM tblaccount WHERE id = $1 ',
            [from_account]
        );

        const fromAccount = fromAccountResult.rows[0];

        if (!fromAccount) {
            return res.status(404).json({ message: ' account informarion not found' });
        }
       
        if(newAmount > fromAccount.account_balance){
            return res.status(400).json({ message: 'Insufficient balance in  account balance' });
        }
       

        //begin tranaction 
        await pool.query("BEGIN");

        // Deduct from source account
        await pool.query(
            'UPDATE tblaccount SET account_balance = account_balance - $1 WHERE id = $2',
            [newAmount, from_account]
        );

        //transfer to destination account
        const toAccount = await pool.query({
           text:`UPDATE tblaccount SET account_balance = account_balance + $1 WHERE id = $2 RETURNING *`,
           values:[newAmount, to_account],
     } );

        //insert transaction details in transaction table for both accounts
        const description = `Transfer from account ${fromAccount.account_name} - ${toAccount.rows[0].account_name}`;

        await pool.query({
            text: 'INSERT INTO tbltransaction (user_id, account_id, description, type, status, source, amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            values: [userId, from_account, description, "expense",'completed',fromAccount.account_name,newAmount],
        });

        const description2 = `Transfer to account ${toAccount.rows[0].account_name} - ${fromAccount.account_name}`;

        await pool.query({
            text: 'INSERT INTO tbltransaction (user_id, account_id, description, type, status, source, amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            values: [userId, to_account, description2, "income",'completed',toAccount.rows[0].account_name,newAmount],
    }    );

    //comit transaction
        await pool.query("COMMIT");

        res.status(200).json({ message: 'Money transferred successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error transferring money', error: error.message });
    }
}
