

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.PG_URI
});

const JWT_SECRET = process.env.JWT_SECRET;
(async () => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS connected_at');
    console.log(`✅ Database connected successfully at ${rows[0].connected_at}`);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1); 
  }
})();

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (emailCheck.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const usernameCheck = await pool.query('SELECT id FROM users WHERE username = $1', [username.trim()]);
    if (usernameCheck.rows.length) return res.status(409).json({ error: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const insert = await pool.query(
      'INSERT INTO users (username, email, password, total_tasks, completed_tasks) VALUES ($1,$2,$3,0,0) RETURNING id, username',
      [username.trim(), email.toLowerCase(), hashedPassword]
    );

    const user = insert.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ message: 'Registration successful', token, username: user.username });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Login successful', token, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/todo', authenticate, async (req, res) => {
  try {
    const { rows: todos } = await pool.query('SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    const transformedTodos = todos.map(t => ({
      id: t.id,
      title: t.title,
      isCompleted: t.is_completed,
      createDate: t.create_date,
      lastUpdatedDate: t.last_updated_date,
      dueDate: t.due_date,
      priority: t.priority,
      user: t.user_id
    }));
    res.json({ todos: transformedTodos });
  } catch (err) {
    console.error('Fetch todos error:', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

app.post('/todo', authenticate, async (req, res) => {
  try {
    const { title, dueDate, priority } = req.body;
    if (!title || title.trim() === '') return res.status(400).json({ error: 'Todo title is required' });

    const currentDate = new Date().toISOString();

    const insert = await pool.query(
      `INSERT INTO todos (title, is_completed, create_date, last_updated_date, due_date, priority, user_id)
       VALUES ($1,false,$2,$3,$4,$5,$6) RETURNING *`,
      [title.trim(), currentDate, currentDate, dueDate || '', priority || 'low', req.user.id]
    );

    await pool.query('UPDATE users SET total_tasks = total_tasks + 1 WHERE id = $1', [req.user.id]);

    res.status(201).json({ todo: insert.rows[0] });
  } catch (err) {
    console.error('Create todo error:', err);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.put('/todo/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, isCompleted, dueDate, priority } = req.body;

    const { rows } = await pool.query('SELECT * FROM todos WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    const todo = rows[0];
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    const updates = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) { updates.push(`title=$${idx++}`); values.push(title); }
    if (typeof isCompleted === 'boolean') { updates.push(`is_completed=$${idx++}`); values.push(isCompleted); }
    if (dueDate !== undefined) { updates.push(`due_date=$${idx++}`); values.push(dueDate); }
    if (priority !== undefined) { updates.push(`priority=$${idx++}`); values.push(priority); }

    updates.push(`last_updated_date=$${idx++}`);
    values.push(new Date().toISOString());

    values.push(id, req.user.id);

    await pool.query(`UPDATE todos SET ${updates.join(', ')} WHERE id=$${idx++} AND user_id=$${idx}`, values);

    res.json({ message: 'Todo updated' });
  } catch (err) {
    console.error('Update todo error:', err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/todo/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM todos WHERE id=$1 AND user_id=$2', [id, req.user.id]);
    const todo = rows[0];
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    await pool.query('DELETE FROM todos WHERE id=$1 AND user_id=$2', [id, req.user.id]);

    await pool.query('UPDATE users SET total_tasks = total_tasks - 1 WHERE id=$1', [req.user.id]);
    if (todo.is_completed) await pool.query('UPDATE users SET completed_tasks = completed_tasks - 1 WHERE id=$1', [req.user.id]);

    res.json({ message: 'Todo deleted' });
  } catch (err) {
    console.error('Delete todo error:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

app.get('/user-stats', authenticate, async (req, res) => {
  try {
    const { data: user, error } = await supabase.from('users')
      .select('username, email, total_tasks, completed_tasks')
      .eq('id', req.user.id)
      .maybeSingle();
    if (error || !user) return res.status(404).json({ error: 'User not found' });

    res.json({
      username: user.username,
      email: user.email,
      totalTasks: user.total_tasks,
      completedTasks: user.completed_tasks
    });
  } catch (err) {
    console.error('User stats error:', err);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

app.get('/get-user', async (req, res) => {
  try {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) return res.status(500).json({ error: 'Server error' });

    res.json({ count: count || 0 });
  } catch (err) {
    console.error('Get user count error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/get-total-tasks', async (req, res) => {
  try {
    const { count, error } = await supabase.from('todos').select('*', { count: 'exact', head: true });
    if (error) return res.status(500).json({ error: 'Internal server error' });

    res.json({ count: count || 0 });
  } catch (err) {
    console.error('Get total tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));