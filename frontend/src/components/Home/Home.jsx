


import { useEffect, useState } from 'react';
import { CheckSquare, Bell, Star, Target, Users, Zap, ArrowRight, Check, Sparkles, TrendingUp, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [userCount, setUserCount] = useState(0);
  const [todoCount, setTodoCount] = useState(0);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userResponse, todoResponse] = await Promise.all([
          fetch("http://localhost:5000/get-user"),
          fetch("http://localhost:5000/get-total-tasks")
        ]);

        const userData = await userResponse.json();
        const todoData = await todoResponse.json();

        if (userData && userData.count !== undefined) {
          setUserCount(userData.count);
        } else {
          setUserCount(0);
        }
        if (todoData && todoData.count !== undefined) {
          setTodoCount(todoData.count);
        } else {
          setTodoCount(0);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setUserCount(0);
        setTodoCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const features = [
    {
      icon: <Target className="w-8 h-8 text-cyan-600" />,
      title: "Smart Task Management",
      description: "Organize your tasks with intelligent categorization and seamless workflow management.",
      color: "from-cyan-50 to-cyan-100",
      iconBg: "bg-cyan-100"
    },
    {
      icon: <Bell className="w-8 h-8 text-emerald-600" />,
      title: "Smart Reminders",
      description: "Never miss important deadlines with intelligent notifications and customizable alerts.",
      color: "from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-100"
    },
    {
      icon: <Star className="w-8 h-8 text-amber-500" />,
      title: "Priority System",
      description: "Focus on what matters most with our advanced priority ranking and task optimization.",
      color: "from-amber-50 to-amber-100",
      iconBg: "bg-amber-100"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Team Collaboration",
      description: "Share tasks and collaborate seamlessly with your team members in real-time.",
      color: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-100"
    },
    {
      icon: <Zap className="w-8 h-8 text-orange-600" />,
      title: "Lightning Fast",
      description: "Experience blazing-fast performance with instant sync across all your devices.",
      color: "from-orange-50 to-orange-100",
      iconBg: "bg-orange-100"
    },
    {
      icon: <CheckSquare className="w-8 h-8 text-teal-600" />,
      title: "Progress Tracking",
      description: "Monitor your productivity with detailed analytics and completion insights.",
      color: "from-teal-50 to-teal-100",
      iconBg: "bg-teal-100"
    }
  ];

  const stats = [
    { 
      value: userCount, 
      label: "Active Users", 
      suffix: "+", 
      icon: <Users className="w-4 h-4" />,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200"
    },
    { 
      value: todoCount, 
      label: "Tasks Completed", 
      suffix: "+", 
      icon: <CheckSquare className="w-4 h-4" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200"
    },
  ];

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white overflow-x-hidden">
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrollY > 50
            ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-slate-200/50'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left side - Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <CheckSquare className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                TaskFlow
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-1">
              <a 
                href="#" 
                className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition-all duration-200 hover:bg-slate-100 rounded-lg"
              >
                Home
              </a>
              <a 
                href="#features" 
                className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition-all duration-200 hover:bg-slate-100 rounded-lg"
              >
                Features
              </a>
              <a 
                href="#about" 
                className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition-all duration-200 hover:bg-slate-100 rounded-lg"
              >
                About
              </a>
              <a 
                href="#contact" 
                className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition-all duration-200 hover:bg-slate-100 rounded-lg"
              >
                Contact Us
              </a>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => navigate('/login')} 
                className="text-slate-700 hover:text-slate-900 font-medium transition-all duration-200 hover:bg-slate-100 px-4 py-2 rounded-lg"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/register')} 
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold transform group-hover:scale-105 transition-all duration-300 flex items-center space-x-2">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>
            </div>

            <button className="md:hidden text-slate-700 hover:text-slate-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      

      <section className="relative py-20 overflow-hidden bg-gradient-to-b from-white to-slate-50">
        <div
          className="absolute inset-0 z-0"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
            opacity: Math.max(0, 1 - scrollY / 500)
          }}
        >
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-300/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-emerald-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            <div
              className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-lg shadow-slate-200/50 mb-8 animate-fade-in"
            >
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-semibold text-slate-700">Trusted by {userCount}+ professionals worldwide</span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-slate-900 mb-8 leading-tight tracking-tight animate-slide-up">
              Stay Organized,
              <span className="block mt-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent animate-gradient">
                Stay Productive
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Transform your daily workflow with our intelligent task management system.
              Focus on what matters most and achieve your goals with ease.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <button 
                onClick={() => navigate('/register')}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transform group-hover:scale-105 transition-all duration-300 flex items-center space-x-3 shadow-xl">
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </button>

              <button 
                onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
                className="group px-8 py-4 rounded-2xl border-2 border-slate-300 hover:border-slate-400 bg-white/80 backdrop-blur-sm font-semibold text-lg text-slate-700 hover:text-slate-900 transition-all duration-300 hover:shadow-xl transform hover:scale-105"
              >
                <span className="flex items-center space-x-2">
                  <span>Watch Demo</span>
                  <div className="w-2 h-2 bg-slate-400 rounded-full group-hover:animate-ping"></div>
                </span>
              </button>
            </div>

            {!loading && (
              <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-lg mx-auto">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className={`group relative ${stat.bgColor} backdrop-blur-sm rounded-3xl p-8 border-2 ${stat.borderColor} hover:scale-105 hover:shadow-2xl hover:shadow-${stat.borderColor.split('-')[1]}-200/50 transition-all duration-500 transform hover:-translate-y-2`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="text-3xl md:text-6xl font-bold text-slate-900 mb-3">
                          {formatNumber(stat.value)}{stat.suffix}
                        </div>
                        
                        <div className="text-lg font-semibold text-slate-700 group-hover:text-slate-900 transition-colors duration-300">
                          {stat.label}
                        </div>
                        
                        <div className={`w-16 h-1 ${stat.bgColor.replace('50', '300')} rounded-full mt-4 group-hover:w-24 transition-all duration-300`}></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 text-slate-600 text-sm max-w-lg mx-auto opacity-0 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
                  Real-time statistics updated daily. Join our growing community of productive individuals.
                </div>
              </div>
            )}
            
            {loading && (
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-lg mx-auto">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="bg-gradient-to-br from-slate-100 to-slate-200 backdrop-blur-sm rounded-3xl p-8 border-2 border-slate-200"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="bg-slate-200 p-4 rounded-2xl mb-6 border border-slate-300 animate-pulse">
                          <div className="w-6 h-6"></div>
                        </div>
                        <div className="text-5xl md:text-6xl font-bold text-transparent bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text mb-3 animate-pulse">
                          ---
                        </div>
                        <div className="text-lg font-semibold text-transparent bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text">
                          Loading...
                        </div>
                        <div className="w-16 h-1 bg-slate-300 rounded-full mt-4 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="demo" className="relative w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-8">
        <div className="relative w-[70vw] h-[70vh]">
          <div className="absolute -inset-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[60px] shadow-2xl">
            <div className="absolute -left-4 top-1/4 w-8 h-8 rounded-full bg-gradient-to-b from-gray-700 to-gray-900"></div>
            <div className="absolute -left-4 top-2/4 w-8 h-8 rounded-full bg-gradient-to-b from-gray-700 to-gray-900"></div>
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <div className="w-1 h-12 bg-gradient-to-t from-gray-700 to-gray-600"></div>
              <div className="w-16 h-1 bg-gray-600 transform rotate-45"></div>
              <div className="w-16 h-1 bg-gray-600 transform -rotate-45"></div>
            </div>
          </div>
          
        <div className="relative w-full h-full rounded-[40px] overflow-hidden border-8 border-gray-900 bg-black">
      <div className="relative w-full h-full p-0">
        <iframe
          src="https://player.vimeo.com/video/1147753419?badge=0&amp;autopause=0&amp;autoplay=1&amp;muted=1&amp;loop=1&amp;player_id=0&amp;app_id=58479&amp;background=1"
          className="absolute top-0 left-0 w-full h-full border-0"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
          allowFullScreen
          title="TaskFlow Demo Video"
          referrerPolicy="strict-origin-when-cross-origin"
        ></iframe>
      </div>
    </div>
        </div>
      </section>

      

      <section id="features" className="py-24 relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block bg-cyan-100 text-cyan-800 px-4 py-2 rounded-full text-sm font-bold mb-6 shadow-lg shadow-cyan-200/50">
              POWERFUL FEATURES
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Everything you need to
              <span className="block mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                stay productive
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Our comprehensive suite of productivity tools helps you manage tasks,
              collaborate with your team, and achieve your goals efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-3xl p-8 border border-slate-200 hover:border-slate-300 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 transform hover:-translate-y-3 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl -z-10"
                     style={{ background: `linear-gradient(135deg, ${feature.color})` }}>
                </div>

                <div className={`mb-6 w-16 h-16 ${feature.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                  {feature.icon}
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-cyan-700 transition-colors duration-300">
                  {feature.title}
                </h3>

                <p className="text-slate-600 leading-relaxed mb-6">
                  {feature.description}
                </p>

                <div className="flex items-center text-cyan-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm">Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-24 bg-gradient-to-br from-slate-50 to-cyan-50/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-bold mb-6 shadow-lg shadow-emerald-200/50">
                WHY TASKFLOW
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Built for the way
                <span className="block mt-2 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  you work
                </span>
              </h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                TaskFlow was created by a team of productivity experts who understand the challenges
                of modern work. Our mission is to help individuals and teams achieve more by providing
                intuitive tools that integrate seamlessly into your workflow.
              </p>

              <div className="space-y-4">
                {[
                  "Trusted by 10,000+ professionals",
                  "99.9% uptime guarantee",
                  "Enterprise-grade security"
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 group animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-lg text-slate-700 font-medium group-hover:text-slate-900 transition-colors duration-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-square">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-200 via-blue-200 to-emerald-200 rounded-[3rem] transform rotate-6 blur-xl opacity-50"></div>
                <div className="relative bg-white rounded-[3rem] p-12 shadow-2xl transform hover:rotate-3 transition-all duration-500">
                  <div className="text-center">
                    <div className="relative inline-block mb-8">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl blur-xl opacity-50"></div>
                      <div className="relative w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-xl">
                        <CheckSquare className="w-10 h-10 text-white" strokeWidth={2.5} />
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Your productivity companion</h3>
                    <p className="text-slate-600 text-lg leading-relaxed mb-8">
                      Designed to help you achieve more with less stress
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-4 border border-cyan-200">
                        <Shield className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Secure</p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl p-4 border border-emerald-200">
                        <Zap className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Fast</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-emerald-600"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to boost your productivity?
          </h2>
          <p className="text-xl text-cyan-50 mb-10 leading-relaxed max-w-2xl mx-auto">
            Join thousands of professionals who have transformed their workflow with TaskFlow.
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="group relative"
          >
            <div className="absolute inset-0 bg-white rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative bg-white text-slate-900 px-10 py-5 rounded-2xl font-bold text-lg transform group-hover:scale-105 transition-all duration-300 shadow-2xl flex items-center space-x-3">
              <span>Start Your Free Trial</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </div>
          </button>
        </div>
      </section>

      <footer className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold text-white">TaskFlow</span>
            </div>

            <div className="flex items-center space-x-8">
              <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200 font-medium">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200 font-medium">Terms</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200 font-medium">Support</a>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-slate-400">
              © 2024 TaskFlow. All rights reserved. Built with care for productivity enthusiasts.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;