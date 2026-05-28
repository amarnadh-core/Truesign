import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrismaticBurst from "./components/PrismaticBurst"; 

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import SignToText from "./pages/SignToText";
import TextToSpeech from "./pages/TextToSpeech";
// 👇 This line is fixed! It now points to the correctly renamed file.
import TextToSign from "./pages/TextToSign";

function App() {
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      
      {/* 🌌 BACKGROUND LAYER 🌌 */}
      <PrismaticBurst
        animationType="rotate3d"
        intensity={2}
        speed={0.5}
        distort={0}
        paused={false}
        offset={{ x: 0, y: 0 }}
        hoverDampness={0.25}
        rayCount={0}
        mixBlendMode="lighten"
        colors={['#ff007a', '#4d3dff', '#ffffff']}
      />

      {/* 📝 FOREGROUND LAYER 📝 */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sign" element={<SignToText />} />
            <Route path="/speech" element={<TextToSpeech />} />
            {/* 👇 Route updated to use the new component */}
            <Route path="/image" element={<TextToSign />} />
          </Routes>
        </Router>
      </div>

    </div>
  );
}

export default App;