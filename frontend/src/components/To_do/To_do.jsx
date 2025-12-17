import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Save, Trash2, Edit3, User, LogOut, CheckCircle2, 
  Circle, TrendingUp, Search, Calendar, Clock, AlertCircle,
  Target, Award, Zap, Star, Filter, SortAsc, Menu, X
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

const priorityConfig = {
  critical: {
    color: 'from-red-500 to-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: AlertCircle,
    badge: 'bg-red-100 text-red-800',
    glow: 'shadow-red-200'
  },
  high: {
    color: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: Zap,
    badge: 'bg-orange-100 text-orange-800',
    glow: 'shadow-orange-200'
  },
  medium: {
    color: 'from-yellow-500 to-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: Target,
    badge: 'bg-yellow-100 text-yellow-800',
    glow: 'shadow-yellow-200'
  },
  low: {
    color: 'from-green-500 to-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: Circle,
    badge: 'bg-green-100 text-green-800',
    glow: 'shadow-green-200'
  }
};

function To_do() {
  const navigate = useNavigate();
  const todayString = new Date().toISOString().slice(0, 10);

  const [modal, setModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editIndex, setEditIndex] = useState(null);

  const [todoElement, setTodoElement] = useState('');
  const [createDate, setCreateDate] = useState(todayString);
  const [lastUpdateDate, setLastUpdateDate] = useState(todayString);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('low');

  const [todoArray, setTodoArray] = useState([]);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const user = localStorage.getItem('username') || 'TaskMaster';

  function isTokenValid(token) {
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
      if (!decoded.exp) return false;
      return decoded.exp * 1000 > Date.now();
    } catch (err) {
      return false;
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!isTokenValid(token)) {
      handleLogout();
    }
  }, []);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/todo', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        const todos = response.data.todos || [];
        // Validate and normalize todos
        const validTodos = todos.filter(todo => todo && todo.id).map(todo => ({
          ...todo,
          priority: todo.priority || 'low',
          dueDate: todo.dueDate || '',
          createDate: todo.createDate || todayString,
          title: todo.title || '',
          isCompleted: todo.isCompleted || false
        }));

        setTodoArray(validTodos);

        // Use todo IDs instead of indices for completed tasks
        const completedIds = new Set(
          validTodos
            .filter(todo => todo.isCompleted)
            .map(todo => todo.id)
        );
        setCompletedTasks(completedIds);

      } catch (err) {
        console.error('Error fetching todos:', err);
      }
    };

    fetchTodos();
  }, []);

  // Helper function to format date for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setTodoElement('');
    setCreateDate(todayString);
    setLastUpdateDate(todayString);
    setDueDate('');
    setPriority('low');
    setModal(true);
    setEditIndex(null);
  };

  const openEditModal = (index) => {
    const todo = todoArray?.[index];
    if (!todo) return;
    setModalMode('edit');
    setEditIndex(index);
    setTodoElement(todo.title || '');
    setCreateDate(formatDateForInput(todo.createDate) || todayString);
    setLastUpdateDate(todayString);
    setDueDate(formatDateForInput(todo.dueDate) || '');
    setPriority(todo.priority || 'low');
    setModal(true);
  };

  const handleModalSave = async () => {
  if (!todoElement.trim() || !dueDate) {
    alert('Please enter all required fields');
    return;
  }
  try {
    if (modalMode === 'add') {
      const response = await axios.post('http://localhost:5000/todo', {
        title: todoElement,
        createDate,
        lastUpdatedDate: lastUpdateDate,
        dueDate,
        priority,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      const newTodo = response.data.todo;
      if (newTodo) {
        const normalizedTodo = {
          ...newTodo,
          priority: newTodo.priority || 'low',
          dueDate: newTodo.dueDate || '',
          createDate: newTodo.createDate || todayString
        };
        setTodoArray(prev => [...prev, normalizedTodo]);
      }

    } else if (modalMode === 'edit' && editIndex !== null) {
      const todoToEdit = todoArray?.[editIndex];
      if (!todoToEdit) return;

      const updateDate = new Date().toISOString().slice(0, 10);
      
      // Create updated todo for optimistic update
      const updatedTodo = {
        ...todoToEdit,
        title: todoElement,
        dueDate,
        priority,
        lastUpdatedDate: updateDate
      };

      // Optimistic update - update UI immediately
      setTodoArray(prev => {
        const newArr = [...prev];
        newArr[editIndex] = updatedTodo;
        return newArr;
      });

      // Send update to backend
      await axios.put(
        `http://localhost:5000/todo/${todoToEdit.id}`,
        {
          title: todoElement,
          isCompleted: todoToEdit.isCompleted,
          createDate: todoToEdit.createDate,
          lastUpdatedDate: updateDate,
          dueDate,
          priority,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      // If you want to ensure perfect sync, you could fetch the updated todo here
      // But optimistic update should be sufficient for most cases
    }

    setModal(false);
    setEditIndex(null);
    setTodoElement('');
    setDueDate('');
    setPriority('low');
    setCreateDate(todayString);
    setLastUpdateDate(todayString);

  } catch (error) {
    console.error('Error saving todo:', error);
    alert('Error saving todo. Please try again.');
    
    // If error occurs, refetch to ensure state consistency
    if (modalMode === 'edit') {
      try {
        const response = await axios.get('http://localhost:5000/todo', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const todos = response.data.todos || [];
        const validTodos = todos.filter(todo => todo && todo.id).map(todo => ({
          ...todo,
          priority: todo.priority || 'low',
          dueDate: todo.dueDate || '',
          createDate: todo.createDate || todayString,
          title: todo.title || '',
          isCompleted: todo.isCompleted || false
        }));
        setTodoArray(validTodos);
      } catch (fetchErr) {
        console.error('Error refetching todos:', fetchErr);
      }
    }
  }
};
  
  const handleDeleteTodo = async id => {
    if (!id) return;
    
    try {
      await axios.delete(`http://localhost:5000/todo/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTodoArray(prev => prev.filter(todo => todo.id !== id));
      setCompletedTasks(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    } catch (err) {
      console.error('Error deleting todo:', err);
      alert('Error deleting todo. Please try again.');
    }
  };

  const handleCheckboxChange = async (todo) => {
  try {
    if (!todo || !todo.id) return;

    const updatedIsCompleted = !todo.isCompleted;
    
    // Optimistic update - update UI immediately
    const todoIndex = todoArray.findIndex(t => t.id === todo.id);
    if (todoIndex !== -1) {
      const updatedArray = [...todoArray];
      updatedArray[todoIndex] = {
        ...updatedArray[todoIndex],
        isCompleted: updatedIsCompleted
      };
      setTodoArray(updatedArray);

      // Update completed tasks set immediately
      setCompletedTasks(prevCompleted => {
        const updatedCompleted = new Set(prevCompleted);
        if (updatedIsCompleted) {
          updatedCompleted.add(todo.id);
        } else {
          updatedCompleted.delete(todo.id);
        }
        return updatedCompleted;
      });
    }

    // Then send to backend
    const response = await axios.put(
      `http://localhost:5000/todo/${todo.id}`,
      { ...todo, isCompleted: updatedIsCompleted },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );

    // If backend returns updated todo, use it to ensure consistency
    const updatedTodo = response.data.todo;
    if (updatedTodo) {
      const finalIndex = todoArray.findIndex(t => t.id === todo.id);
      if (finalIndex !== -1) {
        const finalArray = [...todoArray];
        finalArray[finalIndex] = {
          ...updatedTodo,
          priority: updatedTodo.priority || 'low',
          dueDate: updatedTodo.dueDate || '',
          createDate: updatedTodo.createDate || todayString
        };
        setTodoArray(finalArray);
      }
    }

  } catch (err) {
    console.error('Error updating todo completion status:', err);
    alert('Error updating task. Please try again.');
    
    // If error, revert optimistic update
    const revertIndex = todoArray.findIndex(t => t.id === todo.id);
    if (revertIndex !== -1) {
      const revertedArray = [...todoArray];
      revertedArray[revertIndex] = {
        ...revertedArray[revertIndex],
        isCompleted: todo.isCompleted // Revert to original state
      };
      setTodoArray(revertedArray);

      // Revert completed tasks set
      setCompletedTasks(prevCompleted => {
        const updatedCompleted = new Set(prevCompleted);
        if (todo.isCompleted) {
          updatedCompleted.add(todo.id);
        } else {
          updatedCompleted.delete(todo.id);
        }
        return updatedCompleted;
      });
    }
  }
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };

  const filteredAndSortedTodos = useMemo(() => {
    let filtered = todoArray.filter(todo => todo && todo.id);

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(todo => 
        todo.title && todo.title.toLowerCase().includes(lower)
      );
    }

    if (filterPriority) {
      filtered = filtered.filter(todo => todo.priority === filterPriority);
    }

    if (sortKey === 'dueDateAsc') {
      filtered = filtered.slice().sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      });
    } else if (sortKey === 'dueDateDesc') {
      filtered = filtered.slice().sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : -Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : -Infinity;
        return dateB - dateA;
      });
    } else if (sortKey === 'priorityAsc') {
      filtered = filtered.slice().sort(
        (a, b) => (priorityOrder[a.priority || 'low'] || 0) - (priorityOrder[b.priority || 'low'] || 0)
      );
    } else if (sortKey === 'priorityDesc') {
      filtered = filtered.slice().sort(
        (a, b) => (priorityOrder[b.priority || 'low'] || 0) - (priorityOrder[a.priority || 'low'] || 0)
      );
    }

    return filtered;
  }, [todoArray, searchTerm, sortKey, filterPriority]);

  const calculateProgressWidth = () => {
    const totalTodos = todoArray.length;
    if (totalTodos === 0) return '0%';
    return `${(completedTasks.size / totalTodos) * 100}%`;
  };

  const completionRate = todoArray.length > 0
    ? Math.round((completedTasks.size / todoArray.length) * 100)
    : 0;

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      const diffTime = due - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return null;
    }
  };

  const priorityStats = useMemo(() => {
    const stats = { critical: 0, high: 0, medium: 0, low: 0 };
    todoArray
      .filter(todo => todo && !todo.isCompleted)
      .forEach(todo => {
        const priority = todo.priority || 'low';
        stats[priority]++;
      });
    return stats;
  }, [todoArray]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getOriginalIndex = (todoId) => {
    return todoArray.findIndex(todo => todo.id === todoId);
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'No due date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Modern Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col shadow-sm`}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TaskMaster</h1>
                  <p className="text-sm text-gray-500">Pro</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-gray-100">
          {!sidebarCollapsed ? (
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f3f4f6" />
                      <stop offset="100%" stopColor="#e5e7eb" />
                    </linearGradient>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#1d4ed8" />
                      <stop offset="100%" stopColor="#1e40af" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="url(#bgGradient)"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="url(#progressGradient)"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - completionRate / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    filter={completionRate > 0 ? "url(#glow)" : "none"}
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent mb-1">
                      {completionRate}%
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      {completedTasks.size} of {todoArray.length}
                    </div>
                  </div>
                </div>
                
                {completionRate === 100 && todoArray.length > 0 && (
                  <div className="absolute -top-2 -right-2 animate-bounce">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="compactBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f3f4f6" />
                      <stop offset="100%" stopColor="#e5e7eb" />
                    </linearGradient>
                    <linearGradient id="compactProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1e40af" />
                    </linearGradient>
                  </defs>
                  
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#compactBgGradient)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#compactProgressGradient)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - completionRate / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{completionRate}%</span>
                </div>
                
                {completionRate === 100 && todoArray.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <div className="text-xs font-semibold text-gray-700">{completedTasks.size}/{todoArray.length}</div>
                <div className="text-xs text-gray-500">tasks</div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 flex-1">
          <h3 className={`text-sm font-semibold text-gray-900 mb-4 ${sidebarCollapsed ? 'sr-only' : ''}`}>
            Priority Overview
          </h3>
          <div className="space-y-3">
            {Object.entries(priorityStats).map(([priorityKey, count]) => {
              const config = priorityConfig[priorityKey] || priorityConfig.low;
              const IconComponent = config.icon;
              
              if (sidebarCollapsed) {
                return (
                  <div key={priorityKey} className="flex flex-col items-center">
                    <div className={`p-2 rounded-lg ${config.bg} mb-1`}>
                      <IconComponent className={`w-4 h-4 ${config.text}`} />
                    </div>
                    <span className="text-xs font-bold text-gray-600">{count}</span>
                  </div>
                );
              }
              
              return (
                <div key={priorityKey} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-4 h-4 ${config.text}`} />
                    <span className="text-sm font-medium text-gray-700 capitalize">{priorityKey}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2"
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{user}</p>
                  <p className="text-xs text-gray-500">{getGreeting()}</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfile(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <img
                src="https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2"
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <button
                onClick={() => setShowProfile(true)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <User className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
              <p className="text-gray-500 mt-1">
                {todoArray.filter(t => t && !t.isCompleted).length} active tasks • {completedTasks.size} completed
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </div>
        </div>

        <div className="bg-white border-b border-gray-100 px-8 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
            >
              <option value="">Sort by</option>
              <option value="dueDateAsc">Due date ↑</option>
              <option value="dueDateDesc">Due date ↓</option>
              <option value="priorityAsc">Priority ↑</option>
              <option value="priorityDesc">Priority ↓</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
            >
              <option value="">All priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          {filteredAndSortedTodos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {todoArray.length === 0 ? "No tasks yet" : "No tasks found"}
              </h3>
              <p className="text-gray-500 mb-6">
                {todoArray.length === 0 
                  ? "Create your first task to get started" 
                  : "Try adjusting your search or filters"}
              </p>
              {todoArray.length === 0 && (
                <button
                  onClick={openAddModal}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Task
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedTodos.map((todo) => {
                if (!todo || !todo.id) return null;
                
                const config = priorityConfig[todo.priority || 'low'];
                const IconComponent = config.icon;
                const daysUntilDue = getDaysUntilDue(todo.dueDate || '');
                const isOverdue = daysUntilDue < 0 && !todo.isCompleted;
                const originalIndex = getOriginalIndex(todo.id);
                
                if (originalIndex === -1) return null;
                
                return (
                  <div
                    key={todo.id}
                    className={`group p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      todo.isCompleted 
                        ? 'bg-gray-50 border-gray-200 opacity-75' 
                        : isOverdue
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleCheckboxChange(todo)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          todo.isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {todo.isCompleted && (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${todo.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {todo.title || 'Untitled Task'}
                          </h3>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${config.badge}`}>
                            {(todo.priority || 'low').toUpperCase()}
                          </span>
                          {isOverdue && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due {formatDateForDisplay(todo.dueDate || '')}</span>
                          </div>
                          {todo.dueDate && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span className={isOverdue ? 'text-red-600' : daysUntilDue <= 2 ? 'text-orange-600' : ''}>
                                {daysUntilDue < 0 
                                  ? `${Math.abs(daysUntilDue)} days overdue` 
                                  : daysUntilDue === 0 
                                    ? 'Due today' 
                                    : `${daysUntilDue} days left`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(originalIndex)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'add' ? "Add New Task" : "Edit Task"}
              </h2>
              <button 
                onClick={() => setModal(false)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task *</label>
                <input
                  type="text"
                  value={todoElement}
                  onChange={e => setTodoElement(e.target.value)}
                  placeholder="Enter task description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(priorityConfig).map(([key, config]) => {
                    const IconComponent = config.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPriority(key)}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                          priority === key 
                            ? `${config.bg} ${config.border} ${config.text}` 
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="text-sm font-medium capitalize">{key}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Created</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    value={createDate}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {modalMode === 'add' ? "Add Task" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ${
          showProfile ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
              <button
                onClick={() => setShowProfile(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-6">
            <div className="text-center mb-8">
              <img
                src="https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2"
                alt="Profile"
                className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
              />
              <h3 className="text-xl font-bold text-gray-900">{user}</h3>
              <p className="text-gray-500">Task Manager</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Overview</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700 font-medium">Total Tasks</span>
                  <span className="font-bold text-blue-900">{todoArray.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-medium">Completed</span>
                  <span className="font-bold text-green-900">{completedTasks.size}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-700 font-medium">Success Rate</span>
                  <span className="font-bold text-purple-900">{completionRate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Profile Overlay */}
      {showProfile && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}

export default To_do;