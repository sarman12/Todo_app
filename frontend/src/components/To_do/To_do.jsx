import React, { useState, useEffect } from 'react';
import { Plus, Send, Trash2, Edit3, Save, User, LogOut, CheckCircle2, Circle, TrendingUp } from 'lucide-react';
import axios from 'axios';

function To_do() {
  const [todoArray, setTodoArray] = useState([]);
  const [todoElement, setTodoElement] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [showProfile, setShowProfile] = useState(false);

  const user = localStorage.getItem("username") || "guest";

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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };

  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    }
  };

  const completionRate = todoArray.length > 0 ? Math.round((completedTasks.size / todoArray.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {user}'s Personal Task Master
            </h1>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Progress</h3>
              </div>
              
              <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500 ease-out"
                  style={{ height: calculateProgressWidth() }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-700 mb-1">
                      {completionRate}%
                    </div>
                    <div className="text-sm text-gray-500">Complete</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  {todoArray.length === 0 
                    ? "Add some tasks to get started!" 
                    : completedTasks.size === todoArray.length && todoArray.length > 0
                    ? "🎉 All tasks completed!" 
                    : `${completedTasks.size} of ${todoArray.length} tasks done`}
                </p>
              </div>
            </div>
          </div>

          {/* Todo Section */}
          <div className="lg:col-span-2">
            <div className="bg-white text-black rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={todoElement}
                    onChange={(e) => setTodoElement(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="What would you like to accomplish today?"
                    className="w-full px-4 py-3 bg-gray-50 border text-black border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <button
                  onClick={handleAddTodo}
                  className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Todo List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 pb-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Tasks</h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {todoArray.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No tasks yet. Add one above to get started!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {todoArray.map((todo, index) => (
                      <div key={index} className="group px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleCheckboxChange(index)}
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                              todo.isCompleted
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-green-400'
                            }`}
                          >
                            {todo.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 mx-auto mt-0.5" />
                            ) : (
                              <Circle className="w-4 h-4 mx-auto mt-0.5 text-gray-400" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            {editIndex === index ? (
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyPress={handleEditKeyPress}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                              />
                            ) : (
                              <span className={`block text-gray-800 ${todo.isCompleted ? 'line-through text-gray-500' : ''}`}>
                                {todo.title}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {editIndex === index ? (
                              <button
                                onClick={handleSaveEdit}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEditTodo(index)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
        showProfile ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Profile</h2>
            <button
              onClick={() => setShowProfile(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
            >
              <Plus className="w-5 h-5 rotate-45 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 p-6">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <img
                  src="https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2"
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <button className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-150">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 capitalize">{user}</h3>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Task Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Tasks</span>
                    <span className="font-semibold text-gray-800">{todoArray.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700">Completed</span>
                    <span className="font-semibold text-green-800">{completedTasks.size}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700">Completion Rate</span>
                    <span className="font-semibold text-blue-800">{completionRate}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <p className="text-sm text-center text-gray-700">
                  {todoArray.length === 0
                    ? "Add some tasks to get started!"
                    : completedTasks.size === todoArray.length && todoArray.length > 0
                    ? "🎉 Fantastic! You've completed all your tasks!"
                    : "Keep going! You're making great progress!"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {showProfile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setShowProfile(false)}
        ></div>
      )}
    </div>
  );
}

export default To_do;