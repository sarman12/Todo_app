require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './Todo_db.sqlite'
});

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  totalTasks: { type: DataTypes.INTEGER, defaultValue: 0 },
  completedTasks: { type: DataTypes.INTEGER, defaultValue: 0 }
});

const Todo = sequelize.define('Todo', {
  title: { type: DataTypes.STRING, allowNull: false },
  isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false }
});

User.hasMany(Todo, { onDelete: 'CASCADE' });
Todo.belongsTo(User);

sequelize.sync().then(() => {
  console.log("Database & tables created!");
}).catch(err => console.error("Error initializing database:", err));

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
