import React from "react";

/**
 * Official Emblem of Jharkhand (झारखंड राज्य का राजकीय प्रतीक चिन्ह)
 * Adopted by Government of Jharkhand in August 2020.
 *
 * Structure:
 * - Outer Circle: "झारखंड सरकार" & "GOVERNMENT OF JHARKHAND" in gold lettering
 * - 1st Inner Ring: 24 Elephants (State Animal - strength and natural wealth)
 * - 2nd Inner Ring: 24 Palash Flowers (State Flower - Butea monosperma / Flame of the Forest)
 * - 3rd Inner Ring: 48 Folk Dancers (Soura / Tribal cultural heritage)
 * - Central Core: Lion Capital of Ashoka (Ashok Stambh) with "सत्यमेव जयते"
 */
const JharkhandEmblem = ({ className = "h-12 w-12", title = "Government of Jharkhand Emblem" }) => {
  // Generate 24 points around circle for elephants
  const elephants = Array.from({ length: 24 });
  // Generate 24 points around circle for Palash flowers
  const flowers = Array.from({ length: 24 });
  // Generate 48 points around circle for dancers
  const dancers = Array.from({ length: 48 });

  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>

      <defs>
        {/* Gradients */}
        <radialGradient id="jh-bg-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#085a48" />
          <stop offset="70%" stopColor="#054537" />
          <stop offset="100%" stopColor="#033026" />
        </radialGradient>

        <linearGradient id="jh-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcedbe" />
          <stop offset="45%" stopColor="#e5be65" />
          <stop offset="75%" stopColor="#caa042" />
          <stop offset="100%" stopColor="#f3de9d" />
        </linearGradient>

        <linearGradient id="jh-palash-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff4d15" />
          <stop offset="60%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* Text Arcs */}
        {/* Top Arc for Hindi */}
        <path
          id="jh-text-path-top"
          d="M 52,200 A 148,148 0 1,1 348,200"
          fill="none"
        />
        {/* Bottom Arc for English */}
        <path
          id="jh-text-path-bottom"
          d="M 348,200 A 148,148 0 1,1 52,200"
          fill="none"
        />

        {/* Reusable Elephant Silhouette */}
        <g id="jh-elephant">
          <path
            d="M-5,-4 C-3,-9 4,-9 7,-5 C9,-3 9,2 7,4 C6,6 5,8 5,10 C4,10 3,10 3,8 C3,7 2,6 1,6 C0,6 -1,8 -1,10 C-2,10 -3,10 -3,7 C-4,6 -5,5 -6,4 C-7,2 -7,-1 -5,-4 Z"
            fill="#ffffff"
            opacity="0.95"
          />
          {/* Trunk & tusks */}
          <path
            d="M7,1 C9,2 10,5 9,7 C8.5,8 7.5,7 8,6 C8.5,5 7.5,3 6,3"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="5" cy="-2" r="0.8" fill="#caa042" />
        </g>

        {/* Reusable Palash Flower Silhouette */}
        <g id="jh-palash">
          {/* Keel petal (large curved flame petal) */}
          <path
            d="M0,-8 C4,-5 6,-1 4,4 C2,7 0,8 0,8 C0,8 -2,7 -4,4 C-6,-1 -4,-5 0,-8 Z"
            fill="url(#jh-palash-grad)"
          />
          {/* Wing petals */}
          <path
            d="M0,0 C3,-3 7,-3 8,0 C7,3 4,4 0,3 Z"
            fill="#ff772e"
            opacity="0.9"
          />
          <path
            d="M0,0 C-3,-3 -7,-3 -8,0 C-7,3 -4,4 0,3 Z"
            fill="#ff772e"
            opacity="0.9"
          />
          {/* Base calyx */}
          <ellipse cx="0" cy="6" rx="2" ry="1.5" fill="#1b4d3e" />
        </g>

        {/* Reusable Folk Dancer Silhouette */}
        <g id="jh-dancer">
          {/* Head */}
          <circle cx="0" cy="-6" r="1.5" fill="#ffffff" />
          {/* Torso & arms holding hands */}
          <path
            d="M-3,-3 L3,-3 M0,-4.5 L0,2 M-2,6 L0,2 L2,6"
            stroke="#ffffff"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </defs>

      {/* ================= BACKGROUND BASE ================= */}
      <circle cx="200" cy="200" r="196" fill="url(#jh-bg-grad)" />
      
      {/* Outer Golden Border Rings */}
      <circle cx="200" cy="200" r="194" stroke="url(#jh-gold-grad)" strokeWidth="3.5" />
      <circle cx="200" cy="200" r="188" stroke="url(#jh-gold-grad)" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
      <circle cx="200" cy="200" r="162" stroke="url(#jh-gold-grad)" strokeWidth="2" />

      {/* ================= TEXT RING ================= */}
      {/* Hindi text on top */}
      <text
        fill="url(#jh-gold-grad)"
        fontSize="17"
        fontWeight="800"
        letterSpacing="3.5"
        style={{ fontFamily: "'Noto Sans Devanagari', system-ui, sans-serif" }}
      >
        <textPath href="#jh-text-path-top" startOffset="50%" textAnchor="middle">
          झारखंड सरकार
        </textPath>
      </text>

      {/* Decorative Stars */}
      <text x="44" y="205" fill="url(#jh-gold-grad)" fontSize="14" textAnchor="middle">★</text>
      <text x="356" y="205" fill="url(#jh-gold-grad)" fontSize="14" textAnchor="middle">★</text>

      {/* English text on bottom */}
      <text
        fill="url(#jh-gold-grad)"
        fontSize="13"
        fontWeight="800"
        letterSpacing="3.8"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        <textPath href="#jh-text-path-bottom" startOffset="50%" textAnchor="middle">
          GOVERNMENT OF JHARKHAND
        </textPath>
      </text>

      {/* ================= RING 1: ELEPHANTS (24) ================= */}
      <circle cx="200" cy="200" r="138" stroke="url(#jh-gold-grad)" strokeWidth="1.2" opacity="0.6" />
      <g>
        {elephants.map((_, i) => {
          const angle = (i * 360) / 24;
          return (
            <g
              key={`elephant-${i}`}
              transform={`rotate(${angle} 200 200) translate(200, 50) rotate(90)`}
            >
              <use href="#jh-elephant" />
            </g>
          );
        })}
      </g>

      {/* ================= RING 2: PALASH FLOWERS (24) ================= */}
      <circle cx="200" cy="200" r="114" stroke="url(#jh-gold-grad)" strokeWidth="1.2" opacity="0.6" />
      <g>
        {flowers.map((_, i) => {
          const angle = (i * 360) / 24 + 7.5;
          return (
            <g
              key={`palash-${i}`}
              transform={`rotate(${angle} 200 200) translate(200, 74)`}
            >
              <use href="#jh-palash" />
            </g>
          );
        })}
      </g>

      {/* ================= RING 3: FOLK DANCERS (48) ================= */}
      <circle cx="200" cy="200" r="90" stroke="url(#jh-gold-grad)" strokeWidth="1.2" opacity="0.6" />
      <g>
        {dancers.map((_, i) => {
          const angle = (i * 360) / 48;
          return (
            <g
              key={`dancer-${i}`}
              transform={`rotate(${angle} 200 200) translate(200, 98)`}
            >
              <use href="#jh-dancer" />
            </g>
          );
        })}
      </g>

      {/* ================= CENTRAL CIRCLE ================= */}
      <circle cx="200" cy="200" r="66" fill="#022119" stroke="url(#jh-gold-grad)" strokeWidth="2.5" />
      <circle cx="200" cy="200" r="62" stroke="#e5be65" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.7" />

      {/* ================= ASHOKA LION CAPITAL (ASHOK STAMBH) ================= */}
      <g id="central-ashok-stambh" transform="translate(200, 195) scale(0.68)">
        {/* Lotus Bell Base */}
        <path
          d="M-26,46 C-22,38 -12,34 0,34 C12,34 22,38 26,46 C16,49 -16,49 -26,46 Z"
          fill="url(#jh-gold-grad)"
        />
        {/* Abacus Drum */}
        <rect x="-28" y="22" width="56" height="12" rx="2" fill="url(#jh-gold-grad)" />
        {/* Center Ashoka Chakra on Abacus */}
        <circle cx="0" cy="28" r="5" fill="#022119" stroke="#ffffff" strokeWidth="0.9" />
        <circle cx="0" cy="28" r="1.2" fill="#ffffff" />
        {/* Chakra spokes */}
        <line x1="0" y1="23" x2="0" y2="33" stroke="#ffffff" strokeWidth="0.6" />
        <line x1="-5" y1="28" x2="5" y2="28" stroke="#ffffff" strokeWidth="0.6" />
        <line x1="-3.5" y1="24.5" x2="3.5" y2="31.5" stroke="#ffffff" strokeWidth="0.6" />
        <line x1="-3.5" y1="31.5" x2="3.5" y2="24.5" stroke="#ffffff" strokeWidth="0.6" />

        {/* Animals flanking the wheel */}
        <circle cx="-16" cy="28" r="2.2" fill="#ffffff" opacity="0.9" />
        <circle cx="16" cy="28" r="2.2" fill="#ffffff" opacity="0.9" />

        {/* --- Central & Flanking Asiatic Lions --- */}
        {/* Central Lion Body */}
        <path
          d="M-12,22 L-11,0 C-11,-12 -8,-24 0,-24 C8,-24 11,-12 11,0 L12,22 Z"
          fill="url(#jh-gold-grad)"
        />
        {/* Left Flanking Lion Profile */}
        <path
          d="M-11,18 L-22,12 C-26,6 -27,-8 -18,-18 C-14,-15 -11,-10 -9,-5 Z"
          fill="url(#jh-gold-grad)"
          opacity="0.92"
        />
        {/* Right Flanking Lion Profile */}
        <path
          d="M11,18 L22,12 C26,6 27,-8 18,-18 C14,-15 11,-10 9,-5 Z"
          fill="url(#jh-gold-grad)"
          opacity="0.92"
        />

        {/* Lions' Manes details */}
        <path
          d="M-7,-12 C-5,-10 -3,-12 0,-12 C3,-12 5,-10 7,-12 M-8,-6 C-5,-4 -3,-6 0,-6 C3,-6 5,-4 8,-6 M-9,0 C-6,2 -3,0 0,0 C3,0 6,2 9,0"
          stroke="#022119"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Central Lion Face */}
        {/* Head outline */}
        <path
          d="M-7,-24 C-8,-31 -4,-37 0,-37 C4,-37 8,-31 7,-24 Z"
          fill="url(#jh-gold-grad)"
        />
        {/* Muzzle & Nose */}
        <ellipse cx="0" cy="-24" rx="3.5" ry="2.5" fill="#fcedbe" />
        <polygon points="-1.5,-25.5 1.5,-25.5 0,-23.5" fill="#022119" />
        {/* Eyes */}
        <ellipse cx="-3.5" cy="-28" rx="1.2" ry="0.9" fill="#022119" />
        <ellipse cx="3.5" cy="-28" rx="1.2" ry="0.9" fill="#022119" />
        {/* Ears */}
        <polygon points="-7,-33 -8,-38 -5,-35" fill="url(#jh-gold-grad)" />
        <polygon points="7,-33 8,-38 5,-35" fill="url(#jh-gold-grad)" />

        {/* Left Lion Head Profile */}
        <circle cx="-19" cy="-20" r="4.5" fill="url(#jh-gold-grad)" />
        <path d="M-23,-21 L-27,-20 L-23,-18 Z" fill="url(#jh-gold-grad)" />

        {/* Right Lion Head Profile */}
        <circle cx="19" cy="-20" r="4.5" fill="url(#jh-gold-grad)" />
        <path d="M23,-21 L27,-20 L23,-18 Z" fill="url(#jh-gold-grad)" />

        {/* Satyameva Jayate (सत्यमेव जयते) in Devanagari */}
        <text
          x="0"
          y="60"
          fill="url(#jh-gold-grad)"
          fontSize="8.5"
          fontWeight="700"
          textAnchor="middle"
          letterSpacing="1"
          style={{ fontFamily: "'Noto Sans Devanagari', system-ui, sans-serif" }}
        >
          सत्यमेव जयते
        </text>
      </g>
    </svg>
  );
};

export default JharkhandEmblem;
