/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import {
  CheckSquare,
  Bell,
  Star,
  Target,
  Users,
  Zap,
  ArrowRight,
  Check,
  Sparkles,
  TrendingUp,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [userCount, setUserCount] = useState(0);
  const [todoCount, setTodoCount] = useState(0);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userResponse, todoResponse] = await Promise.all([
          fetch("http://localhost:5000/get-user"),
          fetch("http://localhost:5000/get-total-tasks"),
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
        console.error("Error fetching data:", error);
        setUserCount(0);
        setTodoCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Close mobile menu when clicking a link
  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  const features = [
    {
      icon: <Target className="w-6 h-6 text-cyan-600" />,
      title: "Smart Task Management",
      description: "Organize your tasks with intelligent categorization.",
      color: "from-cyan-50 to-cyan-100",
    },
    {
      icon: <Bell className="w-6 h-6 text-emerald-600" />,
      title: "Smart Reminders",
      description: "Never miss deadlines with intelligent notifications.",
      color: "from-emerald-50 to-emerald-100",
    },
    {
      icon: <Star className="w-6 h-6 text-amber-500" />,
      title: "Priority System",
      description: "Focus on what matters most with priority ranking.",
      color: "from-amber-50 to-amber-100",
    },
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: "Team Collaboration",
      description: "Share tasks and collaborate in real-time.",
      color: "from-blue-50 to-blue-100",
    },
    {
      icon: <Zap className="w-6 h-6 text-orange-600" />,
      title: "Lightning Fast",
      description: "Experience blazing-fast performance across devices.",
      color: "from-orange-50 to-orange-100",
    },
    {
      icon: <CheckSquare className="w-6 h-6 text-teal-600" />,
      title: "Progress Tracking",
      description: "Monitor productivity with detailed analytics.",
      color: "from-teal-50 to-teal-100",
    },
  ];

  const stats = [
    {
      value: userCount,
      label: "Active Users",
      suffix: "+",
      icon: <Users className="w-4 h-4" />,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      value: todoCount,
      label: "Tasks Completed",
      suffix: "+",
      icon: <CheckSquare className="w-4 h-4" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 50
            ? "bg-white/95 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-slate-800">TaskFlow</span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <a
                href="#features"
                className="text-slate-600 hover:text-slate-900 text-sm font-medium transition"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-slate-600 hover:text-slate-900 text-sm font-medium transition"
              >
                About
              </a>
              <a
                href="#contact"
                className="text-slate-600 hover:text-slate-900 text-sm font-medium transition"
              >
                Contact
              </a>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => navigate("/login")}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:shadow-md transition"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-700 hover:text-slate-900 p-2"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-lg">
            <div className="flex flex-col p-4 space-y-3">
              <a
                href="#features"
                onClick={handleMobileNavClick}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-50 transition"
              >
                Features
              </a>
              <a
                href="#about"
                onClick={handleMobileNavClick}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-50 transition"
              >
                About
              </a>
              <a
                href="#contact"
                onClick={handleMobileNavClick}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-50 transition"
              >
                Contact
              </a>
              <div className="pt-2 flex flex-col space-y-2">
                <button
                  onClick={() => {
                    navigate("/login");
                    handleMobileNavClick();
                  }}
                  className="text-slate-600 hover:text-slate-900 text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-50 transition text-left"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    navigate("/register");
                    handleMobileNavClick();
                  }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span className="text-xs font-medium text-slate-700">
              Trusted by {userCount}+ professionals
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Stay Organized,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
              Stay Productive
            </span>
          </h1>

          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Transform your daily workflow with intelligent task management.
            Focus on what matters most.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <button
              onClick={() => navigate("/register")}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:shadow-md transition"
            >
              Start Free Trial
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("demo")
                  .scrollIntoView({ behavior: "smooth" })
              }
              className="px-6 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
            >
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="flex justify-center gap-6">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`${stat.bgColor} rounded-2xl px-6 py-4 min-w-[160px]`}
                >
                  <div className="text-3xl font-bold text-slate-900">
                    {formatNumber(stat.value)}
                    {stat.suffix}
                  </div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        id="demo"
        className="py-16 px-4 bg-gradient-to-br from-gray-900 to-black"
      >
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video">
            <iframe
              src="https://player.vimeo.com/video/1147753419?badge=0&amp;autopause=0&amp;autoplay=1&amp;muted=1&amp;loop=1&amp;player_id=0&amp;app_id=58479&amp;background=1"
              className="absolute top-0 left-0 w-full h-full border-0"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
              allowFullScreen
              title="TaskFlow Demo Video"
            ></iframe>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything you need
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Powerful features to help you manage tasks and boost productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-slate-50 to-slate-100">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-20 px-4 bg-gradient-to-br from-slate-50 to-cyan-50/30"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Built for the way you work
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                TaskFlow helps individuals and teams achieve more with intuitive
                tools that integrate seamlessly into your workflow.
              </p>
              <div className="space-y-3">
                {[
                  "Trusted by 10,000+ professionals",
                  "99.9% uptime guarantee",
                  "Enterprise-grade security",
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-slate-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Your productivity companion
                </h3>
                <p className="text-slate-600 text-sm mb-6">
                  Designed to help you achieve more with less stress
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <Shield className="w-5 h-5 text-cyan-600 mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-700">Secure</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <Zap className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-700">Fast</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-r from-cyan-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to boost your productivity?
          </h2>
          <p className="text-cyan-50 mb-8">
            Join thousands of professionals who have transformed their workflow
          </p>
          <button
            onClick={() => navigate("/register")}
            className="bg-white text-slate-900 px-8 py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition"
          >
            Start Your Free Trial
          </button>
        </div>
      </section>

      <footer className="bg-slate-900 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">TaskFlow</span>
          </div>
          <div className="flex justify-center space-x-6 mb-6">
            <a
              href="#"
              className="text-slate-400 hover:text-white text-sm transition"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-white text-sm transition"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-white text-sm transition"
            >
              Support
            </a>
          </div>
          <p className="text-slate-500 text-sm">
            © 2024 TaskFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
