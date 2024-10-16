import React, { useState, useEffect } from 'react';
import { BiAddToQueue, BiSend } from 'react-icons/bi';
import { FiDelete } from 'react-icons/fi';
import { RxUpdate } from 'react-icons/rx';
import { FaSave, FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './To_do.css';

function To_do() {
  const navigate = useNavigate();
  const [todoArray, setTodoArray] = useState([]);
  const [todoElement, setTodoElement] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [username, setUsername] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/todo', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setTodoArray(response.data.todos);

        const completedIndexes = new Set(response.data.todos
          .map((todo, index) => todo.isCompleted ? index : null)
          .filter(index => index !== null));
        setCompletedTasks(completedIndexes);

        const storedUsername = localStorage.getItem('username');
        setUsername(storedUsername || "Guest");
      } catch (err) {
        console.error('Error fetching todos:', err);
      }
    };

    fetchTodos();
  }, []);

  const handleAddTodo = async () => {
    if (todoElement.trim()) {
      try {
        const response = await axios.post('http://localhost:5000/todo', {
          title: todoElement,
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        setTodoArray(response.data.todos);
        setTodoElement("");
      } catch (err) {
        console.error('Error adding todo:', err.response?.data || err.message);
      }
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/todo/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      const updatedArray = todoArray.filter(todo => todo.id !== id);
      setTodoArray(updatedArray);
      setCompletedTasks(prevCompleted => {
        const updatedCompleted = new Set(prevCompleted);
        return new Set([...updatedCompleted].filter(index => todoArray[index]?.id !== id));
      });
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  const handleEditTodo = (index) => {
    setEditIndex(index);
    setEditText(todoArray[index].title);
  };

  const handleSaveEdit = async () => {
    if (editText.trim()) {
      try {
        const response = await axios.put(`http://localhost:5000/todo/${todoArray[editIndex].id}`, {
          title: editText,
          isCompleted: todoArray[editIndex].isCompleted,
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        const updatedArray = [...todoArray];
        updatedArray[editIndex] = response.data.todos.find(todo => todo.id === todoArray[editIndex].id);
        setTodoArray(updatedArray);
        setEditIndex(null);
        setEditText("");
      } catch (err) {
        console.error('Error saving todo edit:', err);
      }
    }
  };

  const handleCheckboxChange = async (index) => {
    try {
      const todo = todoArray[index];
      const updatedIsCompleted = !todo.isCompleted;

      const response = await axios.put(`http://localhost:5000/todo/${todo.id}`, {
        title: todo.title,
        isCompleted: updatedIsCompleted,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const updatedArray = [...todoArray];
      updatedArray[index] = { ...todo, isCompleted: updatedIsCompleted };
      setTodoArray(updatedArray);

      setCompletedTasks(prevCompleted => {
        const updatedCompleted = new Set(prevCompleted);
        if (updatedCompleted.has(index)) {
          updatedCompleted.delete(index);
        } else {
          updatedCompleted.add(index);
        }
        return updatedCompleted;
      });
    } catch (err) {
      console.error('Error updating todo completion status:', err);
    }
  };

  const calculateProgressWidth = () => {
    if (todoArray.length === 0) return "0%";
    return `${(completedTasks.size / todoArray.length) * 100}%`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className="todo_container">
      <div className="todo_header">
        <h1>{username}'s Personal Task Master!</h1>
        
      </div>

      <div className="todo_content">
        <FaUserCircle 
          className="user_icon" 
          onClick={() => setShowProfile(!showProfile)} 
        />
        <div className="left_part">
          <div className="progress_bar">
            <div className="progress" style={{ height: calculateProgressWidth() }}></div>
          </div>
          <div className="todo_part">
            <div className="todo_list">
              {todoArray.map((todo, index) => (
                <div key={index} className="todo_item">
                  <input 
                    type="checkbox" 
                    checked={todo.isCompleted} 
                    onChange={() => handleCheckboxChange(index)} 
                  />
                  {editIndex === index ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                  ) : (
                    <span>{todo.title}</span>
                  )}
                  {editIndex === index ? (
                    <FaSave onClick={handleSaveEdit} />
                  ) : (
                    <RxUpdate onClick={() => handleEditTodo(index)} />
                  )}
                  <FiDelete onClick={() => handleDeleteTodo(todo.id)} />
                </div>
              ))}
            </div>
            <div className="todo">
              <div className="todo_input">
                <input
                  value={todoElement}
                  onChange={(e) => setTodoElement(e.target.value)}
                  type="text"
                  placeholder="Add a new task..."
                />
                <BiSend onClick={handleAddTodo} />
              </div> 
            </div>
          </div>
        </div>

          <div className={showProfile? 'right_part_visible': 'right_part'}>
            <div className="profile_section">
              <div className="image_div">
                <img src="https://via.placeholder.com/100" alt="Profile" />
                <BiAddToQueue className="add_icon" />
              </div>
              <p>{username}</p>
              <div className="task_stats">
                <p>Total Tasks: {todoArray.length}</p>
                <p>Completed Tasks: {completedTasks.size}</p>
                <p>
                  {todoArray.length === 0? "Add some tasks" : completedTasks.size === todoArray.length
                    ? "Great job! You've completed all your tasks!"
                    : "Keep going! You're doing great!"}
                </p>
              </div>
              <div className="profile_info">
                <p>Task Completion Rate: {Math.round((completedTasks.size / todoArray.length) * 100) || 0}%</p>
              </div>
              <button onClick={handleLogout} className="btn">Log Out</button>
            </div>
          </div>
      </div>
    </div>
  );
}

export default To_do;
