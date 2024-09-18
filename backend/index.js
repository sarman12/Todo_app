require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); 
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect("mongodb+srv://sahaneearman601:lIVTEIxeXswF394S@tododb.k0zdi.mongodb.net/?retryWrites=true&w=majority&appName=Tododb", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Error connecting to MongoDB:", err));

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  totalTasks: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  todos: [
    {
      id: String,
      title: String,
      isCompleted: Boolean
    }
  ]
});

const User = mongoose.model('User', userSchema);

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Register Route
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: `${username} registered successfully`,
      token
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found with this email' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      username: user.username
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Todo Route
app.get('/todo', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ todos: user.todos });
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
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newTodo = { id: uuidv4(), title: title.trim(), isCompleted: false };
    user.todos.push(newTodo);
    user.totalTasks += 1;

    await user.save();

    res.status(201).json({ todos: user.todos });
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
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const todo = user.todos.find(todo => todo.id === id);
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    if (title) todo.title = title.trim();
    if (typeof isCompleted === 'boolean') {
      const previousStatus = todo.isCompleted;
      todo.isCompleted = isCompleted;
      if (previousStatus !== isCompleted) {
        if (isCompleted) {
          user.completedTasks += 1;
        } else {
          user.completedTasks -= 1;
        }
      }
    }

    await user.save();
    res.json({ todos: user.todos });
  } catch (err) {
    console.error('Error updating todo:', err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete Todo Route
app.delete('/todo/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const todoIndex = user.todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) return res.status(404).json({ error: 'Todo not found' });

    const todo = user.todos[todoIndex];
    if (todo.isCompleted) user.completedTasks -= 1;

    user.todos.splice(todoIndex, 1);
    user.totalTasks -= 1;

    await user.save();
    res.json({ todos: user.todos });
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
