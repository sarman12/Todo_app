import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Bell, Star, Target, Users, Zap, ArrowRight, Check } from 'lucide-react';
import { useEffect } from 'react';
import { useState } from 'react';
function Home() {
  const [UserCount,setUserCount]=useState(0);
  const [TodoCount,setTodoCount] = useState(0);
  const navigate = useNavigate();
  
  const handleGetUser = async () => {
    try {
      const response = await fetch("http://localhost:5000/get-user");
      const data = await response.json();

      if (!data || !data.count) {
        console.log("Unable to fetch the data");
        setUserCount(0);
      } else {
        setUserCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUserCount(0);
    }
  };
  const handleGetTodos = async () =>{
    try {
      const response = await fetch("http://localhost:5000/get-total-tasks");
      const data = await response.json();

      if (!data || !data.count) {
        console.log("Unable to fetch the data");
        setTodoCount(0);
      } else {
        setTodoCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setTodoCount(0);
    }
  }

 useEffect(() => {
  const fetchData = async () => {
    await Promise.all([handleGetUser(), handleGetTodos()]);
    setLoading(false);
  };
  fetchData();
}, []);
  const features = [
    {
      icon: <Target className="w-8 h-8 text-blue-600" />,
      title: "Smart Task Management",
      description: "Organize your tasks with intelligent categorization and seamless workflow management."
    },
    {
      icon: <Bell className="w-8 h-8 text-emerald-600" />,
      title: "Smart Reminders",
      description: "Never miss important deadlines with intelligent notifications and customizable alerts."
    },
    {
      icon: <Star className="w-8 h-8 text-amber-600" />,
      title: "Priority System",
      description: "Focus on what matters most with our advanced priority ranking and task optimization."
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: "Team Collaboration",
      description: "Share tasks and collaborate seamlessly with your team members in real-time."
    },
    {
      icon: <Zap className="w-8 h-8 text-orange-600" />,
      title: "Lightning Fast",
      description: "Experience blazing-fast performance with instant sync across all your devices."
    },
    {
      icon: <CheckSquare className="w-8 h-8 text-teal-600" />,
      title: "Progress Tracking",
      description: "Monitor your productivity with detailed analytics and completion insights."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">TaskFlow</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
                Features
              </a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
                About
              </a>
              <button 
                onClick={() => navigate('/login')} 
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/register')} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started
              </button>
            </div>

            <div className="md:hidden">
              <button className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-16 pb-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="text-center">
            
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Stay Organized,
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                Stay Productive
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform your daily workflow with our intelligent task management system. 
              Focus on what matters most and achieve your goals with ease.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button 
                onClick={() => navigate('/register')} 
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-semibold text-lg flex items-center space-x-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              
              <button className="text-gray-700 hover:text-gray-900 font-semibold text-lg px-8 py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 bg-white/60 backdrop-blur-sm">
                Watch Demo
              </button>
            </div>

            <div className="mt-16 flex justify-center  mx-auto ">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl text-center">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{UserCount}+</div>
                  <div className="text-gray-600">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{TodoCount}+</div>
                  <div className="text-gray-600">Tasks Completed</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              FEATURES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to
              <span className="block text-blue-600">stay productive</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive suite of productivity tools helps you manage tasks, 
              collaborate with your team, and achieve your goals efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                <div className="mt-6 flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-200">
                  <span className="text-sm">Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                ABOUT US
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Built for the way
                <span className="block text-purple-600">you work</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                TaskFlow was created by a team of productivity experts who understand the challenges 
                of modern work. Our mission is to help individuals and teams achieve more by providing 
                intuitive tools that integrate seamlessly into your workflow.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Trusted by 10,000+ professionals</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">99.9% uptime guarantee</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Enterprise-grade security</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 flex items-center justify-center">
                <div className="w-full h-full bg-white rounded-2xl shadow-2xl flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <CheckSquare className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Your productivity companion</h3>
                    <p className="text-gray-600">Designed to help you achieve more with less stress</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to boost your productivity?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Join thousands of professionals who have transformed their workflow with TaskFlow.
          </p>
          <button 
            onClick={() => navigate('/register')} 
            className="bg-white text-gray-900 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 font-semibold text-lg"
          >
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TaskFlow</span>
            </div>
            
            <div className="flex items-center space-x-8">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Support</a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">© 2024 TaskFlow. All rights reserved. Built with ❤️ for productivity enthusiasts.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;