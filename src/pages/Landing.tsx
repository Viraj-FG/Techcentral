import { motion } from "framer-motion";
import { Cpu, Scan, Activity, Camera, ShoppingBag, ShieldCheck, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: <Scan className="w-6 h-6 text-white" />,
      tags: ["Computer Vision", "Inventory Tracking", "Intent Detection"],
      title: "The Universal Lens",
      description: "Don't type. Just show it to Kaeva. Point your camera at your fridge, pantry, or vanity. Our AI identifies 10,000+ ingredients, cosmetics, and appliances instantly, building a real-time digital twin of your home.",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070",
      colSpan: "md:col-span-2"
    },
    {
      icon: <Activity className="w-6 h-6 text-kaeva-sage" />,
      tags: ["Macros", "Medical"],
      title: "Prescriptive Nutrition",
      description: "Hypertension? Diabetes? Keto? Kaeva filters your entire food supply chain. We auto-swap high-sodium items in your cart for heart-healthy alternatives.",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053",
      colSpan: ""
    },
    {
      icon: <Camera className="w-6 h-6 text-pink-400" />,
      tags: ["FatSecret API", "Calories"],
      title: "Visual Food Diary",
      description: "Stop searching databases. Snap a photo of your dinner. Kaeva estimates portion sizes and logs calories/macros instantly using Vision AI.",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1760",
      colSpan: ""
    },
    {
      icon: <ShoppingBag className="w-6 h-6 text-cyan-400" />,
      tags: ["Instacart", "Price Watch", "Auto-Refill"],
      title: "Automated Supply Chain",
      description: "The self-filling home. Kaeva tracks your consumption and auto-orders essentials before you run out. One-tap checkout via Instacart with your local store preferences locked in.",
      image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1974",
      colSpan: "md:col-span-2"
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-amber-500" />,
      tags: ["Toxicity Scanner", "Vet Logic"],
      title: "The Guardian Layer",
      description: "Never guess. Scan a grape? We scream if you have a dog. Kaeva cross-references every product against your pet's breed, weight, and toxicity profile to prevent accidents.",
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=2070",
      colSpan: "md:col-span-3"
    }
  ];

  const testimonials = [
    {
      stars: 5,
      text: "I saved $400 in my first month just by stopping food waste. The 'Use First' notification is genius.",
      name: "Sarah Jenkins",
      location: "Seattle, WA",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"
    },
    {
      stars: 5,
      text: "As a diabetic, grocery shopping was a nightmare of label reading. Kaeva filters everything for me automatically.",
      name: "David Chen",
      location: "Bellevue, WA",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200"
    },
    {
      stars: 5,
      text: "The pet safety scanner literally saved my dog from eating Xylitol gum. I will never delete this app.",
      name: "Elena Rodriguez",
      location: "Redmond, WA",
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200"
    }
  ];

  const faqs = [
    {
      question: "Is my data private?",
      answer: "Absolutely. Your inventory data is encrypted. We do not sell your shopping habits to advertisers. Your health data is stored securely and never shared with insurance companies."
    },
    {
      question: "Does it work with any store?",
      answer: "We integrate with the Instacart platform, which covers 85,000+ stores including Costco, Safeway, Petco, and Sephora."
    },
    {
      question: "How much does it cost?",
      answer: "The basic Vision Scanner and Recipe engine are free. The \"Smart Cart\" automation and Health Filters require a Kaeva+ subscription ($12/mo)."
    }
  ];

  return (
    <div className="relative bg-kaeva-void text-foreground overflow-x-hidden">
      {/* Background Video Layer */}
      <div className="fixed inset-0 w-full h-screen -z-10 overflow-hidden">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-15 grayscale contrast-125">
          <source src="https://cdn.coverr.co/videos/coverr-fog-over-a-dark-forest-5543/1080p.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-radial from-transparent to-kaeva-void" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full px-6 md:px-12 py-6 z-50 bg-kaeva-void/80 backdrop-blur-xl border-b border-border">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
            <span className="font-display font-extrabold text-xl tracking-tight text-white">KAEVA</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/auth')}
              className="px-5 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-white hover:text-black transition-all"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/auth')}
              className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-amber-500 transition-all"
            >
              Get App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen w-full flex flex-col justify-center items-center text-center px-6 pt-32 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-space text-xs font-semibold rounded-full mb-8"
        >
          <Cpu size={14} />
          KAEVA OS 1.0
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display font-extrabold text-6xl md:text-8xl lg:text-9xl leading-[0.95] tracking-tight mb-6 bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent"
        >
          Your Home.<br />
          <span className="text-amber-500">On Autopilot.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl text-muted-foreground leading-relaxed mb-12 max-w-2xl"
        >
          The first Prescriptive Life OS. We combine <strong>Vision AI</strong>, <strong>Logistics Automation</strong>, and <strong>Health Logic</strong> to liberate you from the mental load of household management.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap gap-4 items-center justify-center mb-12"
        >
          <button 
            onClick={() => navigate('/auth')}
            className="px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all inline-flex items-center gap-2"
          >
            Initialize System
          </button>
          <a 
            href="#features"
            className="px-10 py-4 bg-white/5 border border-border text-white font-semibold rounded-full hover:bg-white/10 transition-all"
          >
            Explore Features
          </a>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex gap-4 opacity-70 hover:opacity-100 transition-opacity"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" className="h-11 invert" alt="App Store" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" className="h-11 invert" alt="Play Store" />
        </motion.div>
      </section>

      {/* Trust Bar */}
      <div className="w-full py-8 border-y border-border bg-black/30 backdrop-blur-sm">
        <div className="flex justify-center gap-16 flex-wrap items-center max-w-5xl mx-auto px-8 opacity-50 grayscale">
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/TechCrunch_logo.svg" className="h-6 brightness-150" alt="TechCrunch" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Wired_logo.svg" className="h-5 brightness-150" alt="Wired" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/The_Verge_logo.svg" className="h-5 brightness-150" alt="The Verge" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Fast_Company_logo.svg/2560px-Fast_Company_logo.svg.png" className="h-5 brightness-150" alt="Fast Company" />
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="pt-32 pb-16">
        <div className="text-center mb-20">
          <div className="text-amber-500 font-space text-sm font-semibold mb-4 tracking-widest">SYSTEM CAPABILITIES</div>
          <h2 className="font-display font-bold text-5xl">From Vision to Action.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-6 pb-32">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`${feature.colSpan} relative bg-white/[0.03] border border-border rounded-[2rem] p-10 min-h-[400px] flex flex-col justify-end overflow-hidden group hover:-translate-y-2 hover:border-white/20 transition-all duration-400`}
            >
              <img 
                src={feature.image} 
                className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale contrast-110 group-hover:opacity-20 transition-opacity duration-500 z-0" 
                alt=""
              />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                
                <div className="flex gap-2 mb-4 flex-wrap">
                  {feature.tags.map((tag, i) => (
                    <span key={i} className="text-[0.7rem] font-space px-2 py-1 rounded bg-white/5 border border-white/10 text-muted-foreground uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <h3 className="text-3xl font-semibold mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-5xl mb-4">Built for Modern Living.</h2>
          <p className="text-muted-foreground">Join 2,000+ beta users in Seattle.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
          {testimonials.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/[0.02] p-8 rounded-2xl border border-border"
            >
              <div className="flex gap-1 text-amber-500 mb-4">
                {[...Array(review.stars)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-lg leading-relaxed text-foreground mb-6">{review.text}</p>
              <div className="flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${review.avatar})` }}
                />
                <div>
                  <div className="font-semibold">{review.name}</div>
                  <div className="text-sm text-muted-foreground">{review.location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-32">
        <h2 className="font-display font-bold text-5xl text-center mb-12">Frequently Asked Questions</h2>
        
        <div>
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-border">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full text-left py-6 flex justify-between items-center text-xl font-semibold hover:text-amber-500 transition-colors"
              >
                {faq.question}
                <ChevronDown 
                  className={`transform transition-transform ${activeFaq === index ? 'rotate-180' : ''}`}
                  size={24}
                />
              </button>
              <div 
                className={`overflow-hidden transition-all ${activeFaq === index ? 'max-h-96 pb-6' : 'max-h-0'}`}
              >
                <p className="text-base text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="min-h-[60vh] flex flex-col justify-center items-center text-center px-6">
        <h2 className="font-display font-extrabold text-6xl md:text-7xl mb-6">Scan. Plan. Live.</h2>
        <p className="text-xl text-muted-foreground mb-12">Download the beta today.</p>
        <div className="flex gap-4">
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" className="h-[50px] invert" alt="App Store" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" className="h-[50px] invert" alt="Play Store" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 mt-16 bg-[#050505]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto px-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
              <span className="font-display font-extrabold text-xl tracking-tight text-white">KAEVA</span>
            </div>
            <p className="text-sm text-muted-foreground">The Operating System for the modern home.</p>
          </div>
          
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Product</h4>
            <div className="space-y-3">
              <a href="#" className="block text-muted-foreground hover:text-amber-500 transition-colors text-sm">Vision Engine</a>
              <a href="#" className="block text-muted-foreground hover:text-amber-500 transition-colors text-sm">Safety Shield</a>
              <a href="#" className="block text-muted-foreground hover:text-amber-500 transition-colors text-sm">Instacart Integration</a>
              <a href="#" className="block text-muted-foreground hover:text-amber-500 transition-colors text-sm">Pricing</a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Company</h4>
            <div className="space-y-3">
              <a href="#" className="block text-muted-foreground hover:text-amber-500 transition-colors text-sm">About Us</a>
              <a href="#" className="block text-muted-foreground hover:text-amber-500 transition-colors text-sm">Careers</a>
              <a href="#" className="block text-muted-foreground hover:text-amber-500 transition-colors text-sm">Press Kit</a>
              <a href="#" className="block text-muted-foreground hover:text-amber-500 transition-colors text-sm">Contact</a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Legal</h4>
            <div className="space-y-3">
              <a href="#" className="block text-muted-foreground hover:text-amber-500 transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="block text-muted-foreground hover:text-amber-500 transition-colors text-sm">Terms of Service</a>
              <a href="#" className="block text-muted-foreground hover:text-amber-500 transition-colors text-sm">Data Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
