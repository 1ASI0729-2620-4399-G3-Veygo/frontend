<script setup>
/**
 * Presentation component that draws the background of the authentication screens:
 * a night road in long exposure, with headlight and taillight trails heading to the city.
 *
 * @remarks
 * It is decorative (aria-hidden) and respects `prefers-reduced-motion`.
 */
</script>

<template>
  <div class="scene" aria-hidden="true">
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#02040a"/>
          <stop offset=".5" stop-color="#0a1633"/>
          <stop offset=".53" stop-color="#050912"/>
          <stop offset="1" stop-color="#03050b"/>
        </linearGradient>
        <radialGradient id="scene-glow" cx="1150" cy="470" r="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#3b82f6" stop-opacity=".45"/>
          <stop offset=".45" stop-color="#1d4ed8" stop-opacity=".12"/>
          <stop offset="1" stop-color="#1d4ed8" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="scene-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0b1220"/>
          <stop offset="1" stop-color="#121a2b"/>
        </linearGradient>
        <filter id="scene-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7"/>
        </filter>
      </defs>

      <rect width="1600" height="900" fill="url(#scene-sky)"/>
      <rect width="1600" height="900" fill="url(#scene-glow)"/>

      <!-- City skyline on the horizon -->
      <g fill="#060a14">
        <rect x="760" y="444" width="34" height="26"/>
        <rect x="800" y="430" width="22" height="40"/>
        <rect x="828" y="450" width="40" height="20"/>
        <rect x="874" y="418" width="26" height="52"/>
        <rect x="906" y="440" width="36" height="30"/>
        <rect x="948" y="400" width="30" height="70"/>
        <rect x="984" y="426" width="44" height="44"/>
        <rect x="1034" y="390" width="24" height="80"/>
        <rect x="1064" y="436" width="38" height="34"/>
        <rect x="1190" y="428" width="34" height="42"/>
        <rect x="1230" y="398" width="26" height="72"/>
        <rect x="1262" y="440" width="48" height="30"/>
        <rect x="1316" y="412" width="30" height="58"/>
        <rect x="1352" y="446" width="42" height="24"/>
        <rect x="1400" y="422" width="24" height="48"/>
        <rect x="1430" y="452" width="60" height="18"/>
        <rect x="1496" y="434" width="30" height="36"/>
        <rect x="1532" y="448" width="68" height="22"/>
      </g>
      <g fill="#fbbf24" opacity=".55">
        <rect x="954" y="412" width="3" height="3"/>
        <rect x="966" y="430" width="3" height="3"/>
        <rect x="1040" y="404" width="3" height="3"/>
        <rect x="1046" y="424" width="3" height="3"/>
        <rect x="1236" y="410" width="3" height="3"/>
        <rect x="1244" y="436" width="3" height="3"/>
        <rect x="1322" y="424" width="3" height="3"/>
        <rect x="880" y="430" width="3" height="3"/>
      </g>

      <!-- Road -->
      <polygon points="1140,470 1160,470 1900,900 380,900" fill="url(#scene-road)"/>
      <g stroke="rgba(255,255,255,.22)" stroke-width="2" fill="none">
        <line x1="1142" y1="470" x2="380" y2="900"/>
        <line x1="1158" y1="470" x2="1900" y2="900"/>
      </g>
      <line class="scene__lane" x1="1150" y1="470" x2="1140" y2="900"
            stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-dasharray="26 34"/>

      <!-- Headlight trails (coming) -->
      <g fill="none" stroke-linecap="round">
        <path d="M-60 900 Q 700 690 1147 472" stroke="#93c5fd" stroke-width="16" filter="url(#scene-blur)" opacity=".7"/>
        <path class="scene__trail" d="M-60 900 Q 700 690 1147 472" stroke="#e0f2fe" stroke-width="3" stroke-dasharray="220 90"/>
        <path d="M260 940 Q 860 700 1148 473" stroke="#60a5fa" stroke-width="12" filter="url(#scene-blur)" opacity=".55"/>
        <path class="scene__trail scene__trail--slow" d="M260 940 Q 860 700 1148 473" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="160 120"/>
      </g>

      <!-- Taillight trails (going) -->
      <g fill="none" stroke-linecap="round">
        <path d="M1680 880 Q 1330 640 1153 472" stroke="#ef4444" stroke-width="16" filter="url(#scene-blur)" opacity=".7"/>
        <path class="scene__trail scene__trail--reverse" d="M1680 880 Q 1330 640 1153 472" stroke="#fecaca" stroke-width="3" stroke-dasharray="200 100"/>
        <path d="M1480 940 Q 1270 660 1152 473" stroke="#f97316" stroke-width="10" filter="url(#scene-blur)" opacity=".5"/>
        <path class="scene__trail scene__trail--reverse scene__trail--slow" d="M1480 940 Q 1270 660 1152 473" stroke="#fed7aa" stroke-width="2" stroke-dasharray="140 110"/>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.scene {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: #02040a;
}

.scene svg {
  width: 100%;
  height: 100%;
}

.scene__lane {
  animation: dash 1.6s linear infinite;
}

.scene__trail {
  animation: trail 5s linear infinite;
}

.scene__trail--slow {
  animation-duration: 8s;
}

.scene__trail--reverse {
  animation-direction: reverse;
}

@keyframes dash {
  to { stroke-dashoffset: -60; }
}

@keyframes trail {
  to { stroke-dashoffset: -620; }
}

@media (prefers-reduced-motion: reduce) {
  .scene__lane, .scene__trail {
    animation: none;
  }
}
</style>
