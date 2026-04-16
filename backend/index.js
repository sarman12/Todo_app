require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.PG_URI,
});

const JWT_SECRET = process.env.JWT_SECRET;

const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email configuration error:", error);
  } else {
    console.log("✅ Email service ready to send messages");
  }
});

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

async function sendOTPEmail(email, otp, username) {
  const mailOptions = {
    from: `"Todo App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - Todo App Registration",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Todo App</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
          <h2>Hello ${username}!</h2>
          <p>Thank you for registering with Todo App. Please use the following OTP to verify your email address:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      </div>
    `,
    text: `Hello ${username}!\n\nThank you for registering with Todo App. Please use the following OTP to verify your email address: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
  };

  return transporter.sendMail(mailOptions);
}

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
};

(async () => {
  try {
    const { rows } = await pool.query("SELECT NOW() AS connected_at");
    console.log(
      `✅ Database connected successfully at ${rows[0].connected_at}`,
    );
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
})();

app.post("/send-otp", async (req, res) => {
  try {
    const { email, username, fullName, password } = req.body;

    if (!email || !username || !fullName || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()],
    );
    if (emailCheck.rows.length) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const usernameCheck = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username.trim()],
    );
    if (usernameCheck.rows.length) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore.set(email.toLowerCase(), {
      otp,
      expiresAt,
      userData: {
        username: username.trim(),
        email: email.toLowerCase(),
        fullName: fullName.trim(),
        password,
      },
    });

    await sendOTPEmail(email, otp, username);

    setTimeout(
      () => {
        if (
          otpStore.has(email.toLowerCase()) &&
          otpStore.get(email.toLowerCase()).expiresAt < Date.now()
        ) {
          otpStore.delete(email.toLowerCase());
        }
      },
      10 * 60 * 1000,
    );

    res.json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const storedData = otpStore.get(email.toLowerCase());

    if (!storedData) {
      return res
        .status(400)
        .json({ error: "OTP not found or expired. Please request a new OTP." });
    }

    if (storedData.expiresAt < Date.now()) {
      otpStore.delete(email.toLowerCase());
      return res
        .status(400)
        .json({ error: "OTP has expired. Please request a new OTP." });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP. Please try again." });
    }

    const { userData } = storedData;
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const insert = await pool.query(
      "INSERT INTO users (username, email, full_name, password, total_tasks, completed_tasks) VALUES ($1,$2,$3,$4,0,0) RETURNING id, username, email",
      [userData.username, userData.email, userData.fullName, hashedPassword],
    );

    const user = insert.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    otpStore.delete(email.toLowerCase());

    res.json({
      success: true,
      message: "Registration successful!",
      token,
      username: user.username,
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

app.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const storedData = otpStore.get(email.toLowerCase());

    if (!storedData) {
      return res
        .status(400)
        .json({ error: "No pending registration found. Please start over." });
    }

    const newOtp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    storedData.otp = newOtp;
    storedData.expiresAt = expiresAt;
    otpStore.set(email.toLowerCase(), storedData);

    await sendOTPEmail(email, newOtp, storedData.userData.username);

    res.json({
      success: true,
      message: "New OTP sent successfully",
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields are required" });
    if (password.length < 8)
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });

    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()],
    );
    if (emailCheck.rows.length)
      return res.status(409).json({ error: "Email already registered" });

    const usernameCheck = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username.trim()],
    );
    if (usernameCheck.rows.length)
      return res.status(409).json({ error: "Username already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const insert = await pool.query(
      "INSERT INTO users (username, email, password, total_tasks, completed_tasks) VALUES ($1,$2,$3,0,0) RETURNING id, username",
      [username.trim(), email.toLowerCase(), hashedPassword],
    );

    const user = insert.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      username: user.username,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    const user = result.rows[0];
    if (!user)
      return res.status(400).json({ error: "Invalid email or password" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" },
    );
    res.json({ message: "Login successful", token, username: user.username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/todo", authenticate, async (req, res) => {
  try {
    const { rows: todos } = await pool.query(
      "SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id],
    );
    const transformedTodos = todos.map((t) => ({
      id: t.id,
      title: t.title,
      isCompleted: t.is_completed,
      createDate: t.create_date,
      lastUpdatedDate: t.last_updated_date,
      dueDate: t.due_date,
      priority: t.priority,
      user: t.user_id,
    }));
    res.json({ todos: transformedTodos });
  } catch (err) {
    console.error("Fetch todos error:", err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

app.post("/todo", authenticate, async (req, res) => {
  try {
    const { title, dueDate, priority } = req.body;
    if (!title || title.trim() === "")
      return res.status(400).json({ error: "Todo title is required" });

    const currentDate = new Date().toISOString();
    const formattedDueDate = dueDate && dueDate.trim() !== "" ? dueDate : null;

    const insert = await pool.query(
      `INSERT INTO todos (title, is_completed, create_date, last_updated_date, due_date, priority, user_id)
       VALUES ($1,false,$2,$3,$4,$5,$6) RETURNING *`,
      [
        title.trim(),
        currentDate,
        currentDate,
        formattedDueDate,
        priority || "low",
        req.user.id,
      ],
    );

    await pool.query(
      "UPDATE users SET total_tasks = total_tasks + 1 WHERE id = $1",
      [req.user.id],
    );

    res.status(201).json({ todo: insert.rows[0] });
  } catch (err) {
    console.error("Create todo error:", err);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

app.put("/todo/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, isCompleted, dueDate, priority } = req.body;

    const { rows } = await pool.query(
      "SELECT * FROM todos WHERE id = $1 AND user_id = $2",
      [id, req.user.id],
    );
    const todo = rows[0];
    if (!todo) return res.status(404).json({ error: "Todo not found" });

    const updates = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) {
      updates.push(`title=$${idx++}`);
      values.push(title);
    }
    if (typeof isCompleted === "boolean") {
      updates.push(`is_completed=$${idx++}`);
      values.push(isCompleted);

      if (isCompleted === true && !todo.is_completed) {
        await pool.query(
          "UPDATE users SET completed_tasks = completed_tasks + 1 WHERE id = $1",
          [req.user.id],
        );
      } else if (isCompleted === false && todo.is_completed) {
        await pool.query(
          "UPDATE users SET completed_tasks = completed_tasks - 1 WHERE id = $1",
          [req.user.id],
        );
      }
    }
    if (dueDate !== undefined) {
      updates.push(`due_date=$${idx++}`);
      const formattedDueDate =
        dueDate && dueDate.trim() !== "" ? dueDate : null;
      values.push(formattedDueDate);
    }
    if (priority !== undefined) {
      updates.push(`priority=$${idx++}`);
      values.push(priority);
    }

    updates.push(`last_updated_date=$${idx++}`);
    values.push(new Date().toISOString());

    values.push(id, req.user.id);

    await pool.query(
      `UPDATE todos SET ${updates.join(", ")} WHERE id=$${idx++} AND user_id=$${idx}`,
      values,
    );

    res.json({ message: "Todo updated" });
  } catch (err) {
    console.error("Update todo error:", err);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

app.delete("/todo/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      "SELECT * FROM todos WHERE id=$1 AND user_id=$2",
      [id, req.user.id],
    );
    const todo = rows[0];
    if (!todo) return res.status(404).json({ error: "Todo not found" });

    await pool.query("DELETE FROM todos WHERE id=$1 AND user_id=$2", [
      id,
      req.user.id,
    ]);

    await pool.query(
      "UPDATE users SET total_tasks = total_tasks - 1 WHERE id=$1",
      [req.user.id],
    );
    if (todo.is_completed)
      await pool.query(
        "UPDATE users SET completed_tasks = completed_tasks - 1 WHERE id=$1",
        [req.user.id],
      );

    res.json({ message: "Todo deleted" });
  } catch (err) {
    console.error("Delete todo error:", err);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

app.get("/get-user", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(`
      SELECT COUNT(*) as count FROM users
    `);

    const count = parseInt(result.rows[0].count);

    res.json({ count: count || 0 });
  } catch (err) {
    console.error("Get user count error:", err);
    res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  } finally {
    if (client) client.release();
  }
});

app.get("/get-total-tasks", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(`
      SELECT COUNT(*) as count FROM todos
    `);

    const count = parseInt(result.rows[0].count);

    res.json({ count: count || 0 });
  } catch (err) {
    console.error("Get total tasks error:", err);
    res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  } finally {
    if (client) client.release();
  }
});

app.get("/user-stats", authenticate, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      `
      SELECT username, email, total_tasks, completed_tasks 
      FROM users 
      WHERE id = $1
    `,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    res.json({
      username: user.username,
      email: user.email,
      totalTasks: user.total_tasks,
      completedTasks: user.completed_tasks,
    });
  } catch (err) {
    console.error("User stats error:", err);
    res.status(500).json({ error: "Failed to fetch user stats" });
  } finally {
    if (client) client.release();
  }
});

setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of otpStore.entries()) {
      if (value.expiresAt < now) {
        otpStore.delete(key);
        console.log(`Cleaned up expired OTP for ${key}`);
      }
    }
  },
  5 * 60 * 1000,
);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`),
);
