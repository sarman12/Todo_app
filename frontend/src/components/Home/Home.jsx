import React from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home_container">
      <nav>
        <div className="logo">To-Do App</div>
        <ul className="nav_links">
          <li><a href="#features">Features</a></li>
          <li><a href="#about">About</a></li>
        </ul>
        <button onClick={() => navigate('/login')} className="login_btn">Login</button>
      </nav>

      <div className="home_content">
        <h1>Stay Organized with To-Do App</h1>
        <p>Your personal task manager to help you stay focused and organized.</p>
        <button onClick={() => navigate('/register')} className="cta_btn">Get Started</button>
      </div>

      <section id="features" className="features_section">
        <h2>Features</h2>
        <div className="features">
          <div className="feature_item">
            <h3>Task Management</h3>
            <p>Organize your tasks with ease and stay on top of your schedule.</p>
          </div>
          <div className="feature_item">
            <h3>Reminders</h3>
            <p>Set reminders so you never miss an important task.</p>
          </div>
          <div className="feature_item">
            <h3>Prioritization</h3>
            <p>Prioritize your tasks to focus on what matters most.</p>
          </div>
        </div>
      </section>

      <section id="about" className="about_section">
        <h2>About Us</h2>
        <p>To-Do App is a simple and effective tool to help you manage your daily tasks. Whether you're managing work projects, personal errands, or anything in between, our app helps you stay organized and on track.</p>
      </section>

      <footer className="footer">
        <div className="footer_content">
          <p>&copy; 2024 To-Do App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
