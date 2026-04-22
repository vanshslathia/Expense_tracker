import { pool } from "../libs/database.js";

export const createAccount = async(req, res) => {
  // Logic to create a new account
  try{
        const {userId} = req.user; // User ID from JWT token via authMiddleware
       const {name,amount,account_number}=req.body;
       const acccountExists=await pool.query('SELECT * FROM tblaccount WHERE account_number=$1 AND user_id=$2',[account_number, userId]);
       if(acccountExists.rows.length>0){
        return res.status(400).json({message:'Account number already exists'});
       }
         const newAccount=await pool.query('INSERT INTO tblaccount (user_id,account_name,account_balance,account_number) VALUES ($1,$2,$3,$4) RETURNING *',[userId,name,amount,account_number]);
         const account=newAccount.rows[0];
         const userAccounts=Array.isArray(newAccount.rows)?newAccount.rows:[newAccount.rows];

         await pool.query('UPDATE tbluser SET accounts = array_cat(accounts, $1) WHERE id = $2 RETURNING *',[userAccounts,userId]);

            //initial transaction for account creation
            const description = `${account.account_name} (Initial deposit)`;

            await pool.query('INSERT INTO tbltransaction (user_id,account_id,description,status,source,amount,type) VALUES ($1,$2,$3,$4,$5,$6,$7)',[userId,account.id,description,'completed',account.account_number,amount,'income']);

            res.status(201).json({ message: 'Account created successfully', account });
            
  }catch(error){
    res.status(500).json({ message: 'Error creating account', error: error.message });
  }
}

export const getAccounts = async(req, res) => {
  // Logic to get account details
  try{
        const {userId} = req.user; // User ID from JWT token via authMiddleware
        const accounts=await pool.query('SELECT * FROM tblaccount WHERE user_id = $1', [userId]);
        res.status(200).json({ accounts: accounts.rows });
  }catch(error){
    res.status(500).json({ message: 'Error getting accounts', error: error.message });
  }
}

export const addMoneyToAccount = async(req, res) => {
  // Logic to add money to account
  try{
        const {userId} = req.user; // User ID from JWT token via authMiddleware
        const {id} = req.params;
        const {amount}=req.body;
        const newAmount=Number(amount);
        const result=await pool.query('UPDATE tblaccount SET account_balance = account_balance + $1 WHERE id = $2 AND user_id = $3 RETURNING *',[newAmount, id, userId]);
        const accountInformation=result.rows[0];
        const description = `${accountInformation.account_name} (Added money)`;
        await pool.query('INSERT INTO tbltransaction (user_id,account_id,description,status,source,amount,type) VALUES ($1,$2,$3,$4,$5,$6,$7)',[userId,accountInformation.id,description,'completed',accountInformation.account_number,newAmount,'income']);

       res.status(200).json({ message: 'Money added successfully', account: accountInformation });
  }catch(error){
    res.status(500).json({ message: 'Error adding money to account', error: error.message });
  }
}

export const deleteAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tblaccount WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Account not found or unauthorized' });
    }

    res.status(200).json({
      message: 'Account deleted successfully',
      account: result.rows[0],
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error deleting account',
      error: error.message,
    });
  }
};