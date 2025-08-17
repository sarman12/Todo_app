// Load environment variables from .env file if present (for JWT_SECRET, PORT, etc.)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');      // For password hashing
const jwt = require('jsonwebtoken');     // For JSON Web Token creation and verification
const { Sequelize, DataTypes } = require('sequelize');

const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// Enable Cross-Origin Resource Sharing (CORS) so frontend can access this API
app.use(cors());

// Secret key for signing JWT tokens; from env or default fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Initialize Sequelize with SQLite database stored in local file
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './Todo_db.sqlite',
});

// Define User model/schema
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  totalTasks: { type: DataTypes.INTEGER, defaultValue: 0 },
  completedTasks: { type: DataTypes.INTEGER, defaultValue: 0 },
});

// Define Todo model/schema
const Todo = sequelize.define('Todo', {
  title: { type: DataTypes.STRING, allowNull: false },
  isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  createDate: { type: DataTypes.STRING, defaultValue: '' },      // Storing dates as strings
  lastUpdatedDate: { type: DataTypes.STRING, defaultValue: '' },
  dueDate: { type: DataTypes.STRING, defaultValue: '' },
  priority: { type: DataTypes.STRING, defaultValue: 'low' },
});

// Define associations (one-to-many)
User.hasMany(Todo, { onDelete: 'CASCADE' });  // If user deleted, delete their todos
Todo.belongsTo(User);

// Synchronize models with DB, creating tables if needed
sequelize.sync()
  .then(() => {
    console.log("Database & tables created!");
  }).catch(err => {
    console.error("Error initializing database:", err);
  });

// Authentication middleware to protect routes
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Token comes as "Bearer <token>", so split and get token part
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  // Verify token using secret key
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
    req.user = user;      // Attach decoded user info to request
    next();               // Proceed to next middleware/route handler
  });
};

// REGISTER endpoint - create new user
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user with this email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user record
    const newUser = await User.create({ username, email, password: hashedPassword });

    // Generate JWT token for user, expires in 1 hour
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '1h' });

    // Send success response with token
    res.status(201).json({ message: `${username} registered successfully`, token });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// LOGIN endpoint - authenticate user and return token
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'User not found with this email' });
    }

    // Compare provided password with hashed password in DB
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token on successful login
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token, username: user.username });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /todo - Get todos for logged-in user (protected route)
app.get('/todo', authenticate, async (req, res) => {
  try {
    // Find user by ID from token payload, include related todos
    const user = await User.findByPk(req.user.id, { include: [Todo] });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Return user's todos only
    res.json({ todos: user.Todos });
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST /todo - Create a new todo for logged-in user
app.post('/todo', authenticate, async (req, res) => {
  const { title, createDate, lastUpdatedDate, dueDate, priority } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Create new todo linked to user
    await Todo.create({
      title,
      isCompleted: false,
      UserId: user.id,
      createDate,
      lastUpdatedDate,
      dueDate,
      priority,
    });

    // Increment totalTasks count on user
    user.totalTasks += 1;
    await user.save();

    // Return updated todos list
    res.status(201).json({ todos: await user.getTodos() });
  } catch (err) {
    console.error('Error creating todo:', err);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PUT /todo/:id - Update a todo by ID, only allowed for logged-in user owning the todo
app.put('/todo/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, isCompleted, createDate, lastUpdatedDate, dueDate, priority } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    const todo = await Todo.findOne({ where: { id, UserId: user.id } });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    // Update fields with sanitization
    if (title) todo.title = title.trim();
    if (typeof isCompleted === 'boolean') {
      // Adjust completedTasks count on User accordingly
      if (todo.isCompleted !== isCompleted) {
        user.completedTasks += isCompleted ? 1 : -1;
        await user.save();
      }
      todo.isCompleted = isCompleted;
    }
    if (createDate) todo.createDate = createDate;
    if (lastUpdatedDate) todo.lastUpdatedDate = lastUpdatedDate;
    if (dueDate) todo.dueDate = dueDate;
    if (priority) todo.priority = priority;

    await todo.save();

    res.json({ todos: await user.getTodos() });
  } catch (err) {
    console.error('Error updating todo:', err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE /todo/:id - Delete a todo by ID for the logged-in user
app.delete('/todo/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(req.user.id);
    const todo = await Todo.findOne({ where: { id, UserId: user.id } });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    // Delete todo
    await todo.destroy();

    // Update user's task counts
    user.totalTasks -= 1;
    if (todo.isCompleted) user.completedTasks -= 1;
    await user.save();

    res.json({ todos: await user.getTodos() });
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Extra endpoint example: get count of users
app.get('/get-user', async (req, res) => {
  try {
    const usercount = await User.count();
    if (usercount === 0) {
      return res.status(400).send("Not available");
    }
    return res.send({ count: usercount });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// Extra endpoint example: get total tasks count
app.get('/get-total-tasks', async (req, res) => {
  try {
    const totaltodocount = await Todo.count();
    if (!totaltodocount) return res.status(401).json({ msg: 'Not available' });

    return res.json({ count: totaltodocount });
  } catch {
    return res.status(500).json({ msg: 'Internal server error' });
  }
});

// Start server on specified PORT or default 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
