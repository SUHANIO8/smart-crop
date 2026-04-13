import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="font-sans text-slate-800 overflow-hidden">

      {/* ================= HERO SECTION ================= */}
      <section className="bg-[#dcfce7] min-h-[85vh] flex items-center">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">

          {/* Left Text */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-[#1a4d2e] leading-[1.1] mb-6">

              Precision <br />
              Agriculture <br />
              & Soil <br />
              <span className="text-[#2d8a5b]">Intelligence</span>
            </h1>
          </motion.div>

          {/* Right Content */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-[#2f5e4e] text-lg leading-relaxed mb-10 max-w-lg">
              SmartCrop delivers cutting-edge solutions in soil monitoring and
              agricultural analytics, advancing modern farming through real-time
              data intelligence.
            </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(isAuthenticated ? '/predict' : '/login')}
                className="bg-[#2d8a5b] hover:bg-[#24704a] text-white px-10 py-4 rounded-full font-semibold text-lg flex items-center gap-3 shadow-md"
              >
                {isAuthenticated ? 'Get AI recommendations' : ' get recommendations'}
                {/* <span className="text-xl">→</span> */}
              </motion.button>
          </motion.div>

        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section className="py-24 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-6">

          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold text-[#143d26] mb-6">
              Comprehensive Soil Monitoring
            </h2>
            <p className="text-slate-600 text-lg">
              Our advanced sensor network captures critical soil parameters in
              real-time, empowering farmers with actionable insights.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >

            {[
              {
                title: "Moisture Levels",
                desc: "Track soil hydration with precision sensors for optimal irrigation management.",
                icon: "💧",
              },
              {
                title: "pH & Nutrients",
                desc: "Analyze soil chemistry to ensure ideal growing conditions for crops.",
                icon: "🌱",
              },
              {
                title: "Data Analytics",
                desc: "Transform raw sensor data into actionable farming intelligence.",
                icon: "📊",
              },
              {
                title: "AI Predictions",
                desc: "Get crop recommendations based on soil and weather conditions.",
                icon: "⚡",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="bg-[#f0fdf4] p-8 rounded-2xl border border-emerald-100 hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 bg-[#e2f7e9] rounded-xl flex items-center justify-center mb-6 text-2xl">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-[#0f3925] mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}

          </motion.div>
        </div>
      </section>

      {/* ================= PREDICTION SECTION ================= */}
      <section className="bg-[#dcfce7] py-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-5xl font-extrabold text-[#143d26] mb-6">
              Get Crop <br /> Predictions
            </h2>
            <p className="text-[#2f5e4e] text-lg leading-relaxed mb-10">
              Use our AI-powered crop prediction service to determine the best
              crops for your soil and weather conditions.
            </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(isAuthenticated ? '/predict' : '/login')}
                className="bg-[#2d8a5b] hover:bg-[#24704a] text-white px-10 py-4 rounded-full font-semibold text-lg flex items-center gap-3 shadow-md"
              >
                {isAuthenticated ? 'Start Prediction' : 'Sign in to predict'}
                <span className="text-xl">→</span>
              </motion.button>
          </motion.div>

          {/* Right Steps */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-[#eafdf3] p-12 rounded-[2.5rem] shadow-lg"
          >
            <div className="space-y-8">
              {[
                "Soil data analysis",
                "Weather integration",
                "ML predictions",
                "Yield optimization",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-6">
                  <div className="w-11 h-11 rounded-full bg-[#2d8a5b] text-white flex items-center justify-center font-bold text-lg">
                    {i + 1}
                  </div>
                  <span className="text-lg text-[#1a4d2e] font-medium">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

    </div>
  );
};

export default Home;
