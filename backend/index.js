require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './Todo_db.sqlite' // Path to SQLite database file
});

// Define User model
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  totalTasks: { type: DataTypes.INTEGER, defaultValue: 0 },
  completedTasks: { type: DataTypes.INTEGER, defaultValue: 0 }
});

// Define Todo model
const Todo = sequelize.define('Todo', {
  title: { type: DataTypes.STRING, allowNull: false },
  isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// User-Todo relationship (One-to-Many)
User.hasMany(Todo, { onDelete: 'CASCADE' });
Todo.belongsTo(User);

// Sync models with database
sequelize.sync().then(() => {
  console.log("Database & tables created!");
}).catch(err => console.error("Error initializing database:", err));

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
    req.user = user;
    next();
  });
};

// Register Route
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists with this email' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashedPassword });

    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ message: `${username} registered successfully`, token });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'User not found with this email' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token, username: user.username });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Todo Route
app.get('/todo', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { include: [Todo] });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ todos: user.Todos });
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Create Todo Route
app.post('/todo', authenticate, async (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newTodo = await Todo.create({ title, isCompleted: false, UserId: user.id });
    user.totalTasks += 1;
    await user.save();

    res.status(201).json({ todos: await user.getTodos() });
  } catch (err) {
    console.error('Error creating todo:', err);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update Todo Route
app.put('/todo/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, isCompleted } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    const todo = await Todo.findOne({ where: { id, UserId: user.id } });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    if (title) todo.title = title.trim();
    if (typeof isCompleted === 'boolean') {
      todo.isCompleted = isCompleted;
      user.completedTasks += isCompleted ? 1 : -1;
      await user.save();
    }

    await todo.save();
    res.json({ todos: await user.getTodos() });
  } catch (err) {
    console.error('Error updating todo:', err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete Todo Route
app.delete('/todo/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(req.user.id);
    const todo = await Todo.findOne({ where: { id, UserId: user.id } });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    await todo.destroy();
    user.totalTasks -= 1;
    if (todo.isCompleted) user.completedTasks -= 1;
    await user.save();

    res.json({ todos: await user.getTodos() });
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
