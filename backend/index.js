require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();

const Mongo_Db_Connection_String = process.env.Mongo_Db_Connection_String;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

if (!Mongo_Db_Connection_String) {
  console.error('MongoDB connection string not found in environment variables');
  process.exit(1);
}

mongoose.connect(Mongo_Db_Connection_String, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

app.use(express.json());
app.use(cors());

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  totalTasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

const TodoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  isCompleted: { type: Boolean, default: false },
  createDate: { type: String, default: '' },
  lastUpdatedDate: { type: String, default: '' },
  dueDate: { type: String, default: '' },
  priority: { type: String, default: 'low', enum: ['low', 'medium', 'high', 'critical'] },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Todo = mongoose.model("Todo", TodoSchema);

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Forbidden: Invalid token' });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingUserByEmail) {
      return res.status(409).json({ error: 'Account with this email already exists' });
    }

    const existingUserByUsername = await User.findOne({ username: username.trim() });
    if (existingUserByUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      totalTasks: 0,
      completedTasks: 0,
    });

    await newUser.save();
    
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({ 
      message: `${newUser.username} registered successfully`, 
      token,
      username: newUser.username
    });
  } catch (err) {
    if (err.code === 11000) {
      if (err.keyPattern && err.keyPattern.email) {
        return res.status(409).json({ error: 'Account with this email already exists' });
      }
      return res.status(409).json({ error: 'Account already exists' });
    }
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    return res.json({ 
      message: 'Login successful', 
      token, 
      username: user.username 
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/todo', authenticate, async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user.id }).sort({ createdAt: -1 });
    const transformedTodos = todos.map(t => {
      const todo = t.toObject();
      todo.id = todo._id.toString();
      delete todo._id;
      return todo;
    });
    return res.json({ todos: transformedTodos });
  } catch (err) {
    console.error('Fetch todos error:', err);
    return res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

app.post('/todo', authenticate, async (req, res) => {
  try {
    const { title, createDate, lastUpdatedDate, dueDate, priority } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Todo title is required' });
    }
    
    const currentDate = new Date().toISOString();
    
    const todo = new Todo({
      title: title.trim(),
      isCompleted: false,
      createDate: createDate || currentDate,
      lastUpdatedDate: lastUpdatedDate || currentDate,
      dueDate: dueDate || '',
      priority: priority || 'low',
      user: req.user.id,
    });
    
    await todo.save();
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalTasks: 1 } });
    
    const todos = await Todo.find({ user: req.user.id }).sort({ createdAt: -1 });
    const transformedTodos = todos.map(t => {
      const todo = t.toObject();
      todo.id = todo._id.toString();
      delete todo._id;
      return todo;
    });
    
    return res.status(201).json({ todos: transformedTodos });
  } catch (err) {
    console.error('Create todo error:', err);
    return res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.put('/todo/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, isCompleted, createDate, lastUpdatedDate, dueDate, priority } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }

    const todo = await Todo.findOne({ _id: id, user: req.user.id });
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (title !== undefined) {
      if (title.trim().length === 0) {
        return res.status(400).json({ error: 'Todo title cannot be empty' });
      }
      todo.title = title.trim();
    }
    
    if (typeof isCompleted === 'boolean' && todo.isCompleted !== isCompleted) {
      const inc = isCompleted ? 1 : -1;
      await User.findByIdAndUpdate(req.user.id, { $inc: { completedTasks: inc } });
      todo.isCompleted = isCompleted;
    }
    
    if (createDate !== undefined) todo.createDate = createDate;
    if (lastUpdatedDate !== undefined) todo.lastUpdatedDate = lastUpdatedDate;
    else todo.lastUpdatedDate = new Date().toISOString();
    if (dueDate !== undefined) todo.dueDate = dueDate;
    
    if (priority !== undefined) {
      if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority value' });
      }
      todo.priority = priority;
    }
    
    await todo.save();

    const todos = await Todo.find({ user: req.user.id }).sort({ createdAt: -1 });
    const transformedTodos = todos.map(t => {
      const todo = t.toObject();
      todo.id = todo._id.toString();
      delete todo._id;
      return todo;
    });
    
    return res.json({ todos: transformedTodos });
  } catch (err) {
    console.error('Update todo error:', err);
    return res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/todo/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }

    const todo = await Todo.findOneAndDelete({ _id: id, user: req.user.id });
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const decCompleted = todo.isCompleted ? -1 : 0;
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalTasks: -1, completedTasks: decCompleted }
    });

    const todos = await Todo.find({ user: req.user.id }).sort({ createdAt: -1 });
    const transformedTodos = todos.map(t => {
      const todo = t.toObject();
      todo.id = todo._id.toString();
      delete todo._id;
      return todo;
    });
    
    return res.json({ todos: transformedTodos });
  } catch (err) {
    console.error('Delete todo error:', err);
    return res.status(500).json({ error: 'Failed to delete todo' });
  }
});

app.get('/user-stats', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json({
      username: user.username,
      email: user.email,
      totalTasks: user.totalTasks,
      completedTasks: user.completedTasks
    });
  } catch (err) {
    console.error('User stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

app.get('/get-user', async (req, res) => {
  try {
    const usercount = await User.countDocuments();
    return res.json({ count: usercount });
  } catch (err) {
    console.error('Get user count error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/get-total-tasks', async (req, res) => {
  try {
    const totaltodocount = await Todo.countDocuments();
    return res.json({ count: totaltodocount });
  } catch (err) {
    console.error('Get total tasks error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res) => {
  return res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});