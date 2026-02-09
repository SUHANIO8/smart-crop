import React, { useState } from "react";

const About = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="w-full bg-[#f6fbf7] text-[#184d37]">

     {/* ================= HERO SECTION ================= */}
<section className="max-w-7xl mx-auto px-6 pt-14 pb-8 text-center">
  <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
    About SmartCrop
  </h1>
  <p className="text-xl max-w-4xl mx-auto text-[#5f7f73] leading-relaxed">
    Pioneering the future of agriculture through intelligent soil monitoring systems
    and data-driven farming solutions.
  </p>
</section>


      {/* ================= MISSION / TEAM / IMPACT ================= */}
      <section className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-12 text-center">
        <div>
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#e6f2ea] flex items-center justify-center">
            🎯
          </div>
          <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
          <p className="text-[#5f7f73] leading-relaxed">
            To empower farmers worldwide with precision agriculture technology
            that maximizes yield while minimizing environmental impact through
            intelligent soil monitoring.
          </p>
        </div>

        <div>
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#e6f2ea] flex items-center justify-center">
            👥
          </div>
          <h3 className="text-2xl font-bold mb-4">Our Team</h3>
          <p className="text-[#5f7f73] leading-relaxed">
            A diverse group of agronomists, engineers, and data scientists
            dedicated to solving real-world agricultural challenges with
            innovative technology.
          </p>
        </div>

        <div>
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#e6f2ea] flex items-center justify-center">
            🏅
          </div>
          <h3 className="text-2xl font-bold mb-4">Our Impact</h3>
          <p className="text-[#5f7f73] leading-relaxed">
            Helping thousands of farms optimize water usage, reduce fertilizer
            waste, and increase crop yields through data-driven decision making.
          </p>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-[#dceedd] py-14">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="bg-[#2f855a] text-white px-4 py-2 rounded-xl font-bold">
              02
            </span>
            <h2 className="text-4xl font-extrabold">How It Works</h2>
          </div>
          <p className="max-w-3xl mx-auto text-lg text-[#5f7f73] mb-12">
            Watch our soil sensors in action as they collect, transmit, and analyze
            critical agricultural data in real-time.
          </p>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              "Sensors deployed in soil",
              "Collecting data",
              "Transmitting to cloud",
              "Processing analytics",
              "Delivering insights"
            ].map((step, index) => {
              const isActive = activeStep === index;

              return (
                <div
                  key={index}
                  onMouseEnter={() => setActiveStep(index)}
                  className={`p-6 rounded-2xl border text-center cursor-pointer transition-all duration-300
                    ${
                      isActive
                        ? "bg-[#bfe0c7] border-[#2f855a] shadow-lg"
                        : "bg-[#eef7f1] border-[#d1e6da]"
                    }
                  `}
                >
                  <div
                    className={`w-10 h-10 mx-auto mb-4 rounded-xl flex items-center justify-center font-bold
                      ${
                        isActive
                          ? "bg-[#2f855a] text-white"
                          : "bg-[#d1e6da] text-[#184d37]"
                      }
                    `}
                  >
                    {index + 1}
                  </div>
                  <p className="font-semibold">{step}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= OUR STORY ================= */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-4xl font-extrabold mb-8">Our Story</h2>

        <div className="space-y-1 text-lg text-[#5f7f73] leading-relaxed">
          <p>
            SmartCrop was founded in 2020 by a team of agricultural engineers and
            data scientists who recognized the critical need for real-time soil
            monitoring in modern farming.
          </p>

          <p>
            Traditional farming methods often rely on guesswork and periodic manual
            testing, leading to inefficient resource use and suboptimal crop yields.
          </p>

          <p>
            Our breakthrough came when we developed a network of wireless soil
            sensors capable of continuously monitoring multiple parameters including
            moisture levels, temperature, pH balance, and nutrient content.
          </p>

          <p>
            This data is transmitted in real-time to our cloud platform, where
            advanced analytics transform raw measurements into actionable farming
            insights.
          </p>

          <p>
            Today, SmartCrop serves farms across multiple continents, helping growers
            make informed decisions about irrigation, fertilization, and crop
            management.
          </p>

          <p>
            We continue to innovate, expanding our sensor capabilities and refining
            our analytics algorithms to address the evolving challenges of
            sustainable agriculture in a changing climate.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;
