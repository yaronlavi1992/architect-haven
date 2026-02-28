import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const texts = ["Architects.", "Consultants.", "Managers.", "Engineers."];
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      const current = texts[currentIndex];
      
      if (isDeleting) {
        setCurrentText(current.substring(0, currentText.length - 1));
        
        if (currentText === "") {
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % texts.length);
        }
      } else {
        setCurrentText(current.substring(0, currentText.length + 1));
        
        if (currentText === current) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      }
    }, isDeleting ? 50 : 100);
    
    return () => clearTimeout(timeout);
  }, [currentText, currentIndex, isDeleting, texts]);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Senior Architect",
      company: "Urban Design Co.",
      text: "Architect Haven has revolutionized how we present building concepts to clients. The 3D visualization is incredible.",
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      role: "Construction Manager",
      company: "BuildTech Solutions",
      text: "The document management system keeps all our project files organized and easily accessible. Game changer!",
      avatar: "MC"
    },
    {
      name: "Emily Rodriguez",
      role: "Design Consultant",
      company: "Modern Spaces",
      text: "Being able to share interactive 3D models with stakeholders has improved our collaboration tremendously.",
      avatar: "ER"
    },
    {
      name: "David Park",
      role: "Project Engineer",
      company: "Structural Innovations",
      text: "The apartment-level detail and document attachment features are exactly what we needed for complex projects.",
      avatar: "DP"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <div className="text-white text-2xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Architect Haven
        </div>
        <Link
          to="/auth"
          className="bg-white text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          The Best 3D Modeling Tool for{" "}
          <span className="text-blue-400">
            {currentText}
            <span className="animate-pulse">|</span>
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl">
          Bridging the gap between Architects and Advisors.
        </p>
        
        <Link
          to="/auth"
          className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
        >
          Start Building Models For Free
        </Link>
      </div>

      {/* Testimonials Section */}
      <div className="px-6 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Trusted by Industry Leaders
        </h2>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[#192339] p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{testimonial.name}</h3>
                  <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  <p className="text-gray-500 text-sm">{testimonial.company}</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">"{testimonial.text}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400">
        <p>&copy; 2024 Architect Haven. All rights reserved.</p>
      </footer>
    </div>
  );
}
