import { motion } from "framer-motion";
import { Cpu, Scan, Activity, Camera, ShoppingBag, ShieldCheck, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicShell from "@/components/layout/PublicShell";

const Landing = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: <Cpu className="w-6 h-6" />,
      title: "Vision Scanning",
      description: "Just point and capture. AI instantly reads barcodes, labels, and full ingredient panels.",
      bgGradient: "from-primary/10 to-secondary/10"
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Nutrition Autopilot",
      description: "Track every meal effortlessly. Get real-time macros tailored to your household.",
      bgGradient: "from-accent/10 to-primary/10"
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: "Food Logging",
      description: "Snap your plate—AI logs calories, macros, and keeps your digital twin in sync.",
      bgGradient: "from-destructive/10 to-primary/10"
    },
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: "Smart Shopping",
      description: "Auto-refill items before they run out. Never forget essentials again.",
      bgGradient: "from-primary/10 to-accent/10"
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Pet Safety",
      description: "Real-time toxicity alerts for your pets. Prevent accidents before they happen.",
      bgGradient: "from-secondary/10 to-accent/10"
    },
    {
      icon: <Scan className="w-6 h-6" />,
      title: "Beauty Profile",
      description: "Know what's in your skincare and hair products. Personalized to your profile.",
      bgGradient: "from-destructive/10 to-primary/10"
    }
  ];

  const faqs = [
    {
      question: "How does the Vision Scanner work?",
      answer: "Simply point your camera at any product, barcode, or shelf. Our AI instantly identifies the item, reads nutrition facts, and adds it to your household inventory."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. All data is encrypted and stored securely. We never sell your information to third parties."
    },
    {
      question: "Can I share my household with family?",
      answer: "Yes! Invite family members to collaborate on your shared inventory and meal planning."
    },
    {
      question: "What about pet safety features?",
      answer: "We cross-reference ingredients against toxicity databases for dogs and cats, alerting you in real-time if you scan something harmful."
    },
    {
      question: "Do I need a subscription?",
      answer: "Basic features are free forever. Premium features unlock advanced analytics and AI meal planning."
    }
  ];

  const testimonials = [
    {
      name: "Emily R.",
      role: "Busy Parent",
      quote: "This app changed how I shop and cook. I never forget groceries, and my kids' allergies are always protected.",
      avatar: "https://i.pravatar.cc/150?img=5"
    },
    {
      name: "Marcus T.",
      role: "Fitness Enthusiast",
      quote: "Tracking macros has never been easier. The AI does all the work—I just eat and scan.",
      avatar: "https://i.pravatar.cc/150?img=12"
    },
    {
      name: "Sarah K.",
      role: "Pet Owner",
      quote: "The pet safety feature literally saved my dog's life. I almost bought grapes—app warned me instantly.",
      avatar: "https://i.pravatar.cc/150?img=9"
    }
  ];

  return (
    <PublicShell>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg"></div>
            <span className="text-xl font-bold font-['Space_Grotesk']">KAEVA</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/auth')} className="px-6 py-2 text-sm font-medium rounded-lg border border-white/20 hover:bg-white/10 transition">
              Login
            </button>
            <button onClick={() => navigate('/auth')} className="px-6 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition shadow-lg shadow-primary/30">
              Get App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden pt-20">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-6xl md:text-7xl font-bold text-center max-w-4xl font-['Space_Grotesk'] leading-tight"
        >
          Your Home.
          <br />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">On Autopilot.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-300 text-center max-w-2xl mt-6"
        >
          Your entire household—food, beauty, pets—powered by a personal AI that knows you, your family, and every product you own.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex gap-4 mt-8"
        >
          <button onClick={() => navigate('/auth')} className="px-8 py-4 text-lg font-medium rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition shadow-lg shadow-primary/50">
            Start Free
          </button>
          <button className="px-8 py-4 text-lg font-medium rounded-xl border border-white/20 hover:bg-white/10 transition">
            Watch Demo
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex gap-4 opacity-70 hover:opacity-100 transition-opacity mt-6"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" className="h-11 invert" alt="App Store" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" className="h-11 invert" alt="Play Store" />
        </motion.div>
      </section>

      {/* Trust Bar */}
      <div className="w-full py-8 border-y border-border bg-black/30 backdrop-blur-sm">
        <div className="flex justify-center gap-16 flex-wrap items-center max-w-5xl mx-auto px-8 opacity-50 grayscale">
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/TechCrunch_logo.svg" className="h-6 brightness-150" alt="TechCrunch" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" className="h-6 brightness-150" alt="Google" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" className="h-5 brightness-150" alt="Netflix" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" className="h-6 brightness-150 invert" alt="Apple" />
        </div>
      </div>

      {/* Features Bento Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 font-['Space_Grotesk']"
        >
          Everything You Need.
          <br />
          <span className="text-gray-400">In One Place.</span>
        </motion.h2>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
              className={`p-8 rounded-2xl bg-gradient-to-br ${feature.bgGradient} border border-white/10 backdrop-blur-sm hover:scale-105 transition`}
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 font-['Space_Grotesk']"
        >
          Loved by Households
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                <div>
                  <div className="font-bold">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </div>
              <p className="text-gray-300 italic">"{testimonial.quote}"</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 font-['Space_Grotesk']"
        >
          Questions?
        </motion.h2>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm"
            >
              <button
                onClick={() => toggleFaq(i)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition"
              >
                <span className="text-lg font-medium">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {activeFaq === i && (
                <div className="px-6 pb-6 text-gray-400">
                  {faq.answer}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition">Features</a></li>
              <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition">Roadmap</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition">About</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms</a></li>
              <li><a href="#" className="hover:text-white transition">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Connect</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
              <li><a href="#" className="hover:text-white transition">Discord</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
          © 2024 KAEVA. All rights reserved.
        </div>
      </footer>
    </PublicShell>
  );
};

export default Landing;
