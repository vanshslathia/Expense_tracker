# JWT Authentication Debugging Guide

## ✅ Issues Fixed

### 1. **Authorization Header Validation**
- Added specific error messages for each validation failure
- Now distinguishes between: missing header, wrong format, missing token

### 2. **Improved Error Logging**
- Token expiration errors → "Token expired. Please sign in again."
- Invalid token signature → "Invalid token"
- Missing JWT_SECRET → Clear error message with suggestion
- All errors are logged with emojis for quick identification (✅ ✅ ⚠️ ❌)

### 3. **Best Practice: req.user instead of req.body.user**
- Changed middleware to store user data in `req.user` (Express standard)
- Updated all controllers to use `req.user`
- This prevents conflicts with actual request body data

### 4. **JWT_SECRET Validation**
- Now checks if JWT_SECRET exists before attempting verification
- Provides clear error if environment variable is missing

---

## 🧪 How to Test Authentication

### **Step 1: Ensure .env is Properly Configured**

Create `.env` file with:
```
PORT=5000
JWT_SECRET=your_super_secret_key_here
# ... other config
```

**Important:** Make sure JWT_SECRET is:
- Not empty
- Same in both signin and middleware (they use the same `process.env.JWT_SECRET`)
- Long and random for production

### **Step 2: Sign Up a User**

```bash
curl -X POST http://localhost:5000/api-v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "email": "john@example.com",
    "password": "Password123!"
  }'
```

Response:
```json
{
  "message": "User registered successfully",
  "user": { "id": 1, "firstName": "John", "email": "john@example.com" }
}
```

### **Step 3: Sign In to Get Token**

```bash
curl -X POST http://localhost:5000/api-v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123!"
  }'
```

Response:
```json
{
  "message": "User signed in successfully",
  "user": { "id": 1, "firstName": "John", "email": "john@example.com" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copy the token value** (the long string in the `token` field)

### **Step 4: Access Protected Route with Token**

```bash
curl -X GET http://localhost:5000/api-v1/users/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Response (should succeed):
```json
{
  "message": "User retrieved successfully",
  "user": { "id": 1, "firstName": "John", "email": "john@example.com" }
}
```

### **Step 5: Test Error Cases**

**Missing Authorization Header:**
```bash
curl -X GET http://localhost:5000/api-v1/users/
```
Response: `{ "message": "No authorization header provided" }` ✅

**Wrong Format (missing Bearer):**
```bash
curl -X GET http://localhost:5000/api-v1/users/ \
  -H "Authorization: YOUR_TOKEN_HERE"
```
Response: `{ "message": "Invalid authorization header format. Use: Bearer <token>" }` ✅

**Invalid Token:**
```bash
curl -X GET http://localhost:5000/api-v1/users/ \
  -H "Authorization: Bearer invalid_token_123"
```
Response: `{ "message": "Invalid token" }` ✅

---

## 📋 Console Logs to Look For

When running your server, you should see:

```
✅ Token verified for userId: 1          // When authentication succeeds
⚠️ No authorization header provided       // When header is missing
⚠️ Invalid token: jwt malformed           // When token format is wrong
⚠️ Token expired: jwt expired             // When token expired
❌ JWT_SECRET not configured              // When env var is missing
```

---

## 🔍 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Always 401 on protected routes | JWT_SECRET mismatch | Verify `.env` file has JWT_SECRET set before starting server |
| "Token expired" immediately | Token expiration time too short | Check `createJWT` function (currently 1 day) |
| 500 Server Error | JWT_SECRET not in .env | Add `JWT_SECRET=your_secret` to `.env` and restart |
| "Invalid token" for valid token | Different JWT_SECRET used to create vs verify | Ensure same `process.env.JWT_SECRET` in both functions |
| TypeError: Cannot read property 'userId' | Still using `req.body.user` | Use `req.user` instead (already fixed) |

---

## 🚀 Frontend Integration Example

```javascript
// Login and store token
async function login(email, password) {
  const res = await fetch('http://localhost:5000/api-v1/auth/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  localStorage.setItem('token', data.token); // Store token
  return data;
}

// Use token in protected requests
async function getUser() {
  const token = localStorage.getItem('token');
  const res = await fetch('http://localhost:5000/api-v1/users/', {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}` // Send token with Bearer prefix
    }
  });
  return res.json();
}
```

---

## 📚 Files Modified

1. ✅ `middleware/authMiddleware.js` - Enhanced with debug logs and error handling
2. ✅ `controllers/userController.js` - Changed `req.body.user` to `req.user`
3. ✅ `.env.example` - Created template for required environment variables

All authentication should now work correctly! 🎉
