import { useState } from "react";
import SignToText from "./pages/SignToText";
import TextToSign from "./pages/TextToSign";

// View 1: The Initial Landing Page
function LandingPage({ onEnter }) {
  return (
    <div style={styles.landingContainer} className="animate-fadeY">
      <div style={styles.logoWrapper}>
        <h1 className="hero-text" style={{ textAlign: "center", marginBottom: "2rem" }}>
          TRUE<br/>SIGN
        </h1>
        <p className="sub-text" style={{ textAlign: "center", marginBottom: "4rem" }}>
          Advanced AI Landmark Translation Framework
        </p>
        <button 
          onClick={onEnter} 
          style={styles.enterBtn}
          className="hover-glow"
        >
          Initialize Core
        </button>
      </div>
    </div>
  );
}

// View 2: The Two Huge Action Buttons
function Dashboard({ setActiveTab }) {
  return (
    <div style={styles.dashboardContainer} className="animate-fadeY">
      <h2 style={{ fontSize: "2rem", fontWeight: "300", letterSpacing: "0.2em", marginBottom: "4rem", color: "var(--text-dim)" }}>
        SELECT DIRECTIVE
      </h2>
      
      <div style={styles.cardGrid}>
        <button onClick={() => setActiveTab("scanner")} style={styles.hugeActionCard} className="hover-glow">
          <span style={styles.cardNumber}>01</span>
          <h3 style={styles.cardTitle}>Sign to Text</h3>
          <p style={styles.cardDesc}>Visual Camera Translation</p>
        </button>

        <button onClick={() => setActiveTab("puppet")} style={styles.hugeActionCard} className="hover-glow">
          <span style={styles.cardNumber}>02</span>
          <h3 style={styles.cardTitle}>Text to Sign</h3>
          <p style={styles.cardDesc}>Kinematic 3D Puppet</p>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("landing"); 

  return (
    <div style={styles.appShell}>
      
      {/* 🟢 AMBIENT LAYERS 🟢 */}
      <div className="ambient-layer"></div>
      <div className="ambient-glow"></div>

      {/* Sleek Top Navigation (Hidden on Landing) */}
      {activeTab !== "landing" && (
        <nav style={styles.topNav} className="animate-fadeY">
          <div 
            onClick={() => setActiveTab("dashboard")} 
            style={{ ...styles.navLogo, cursor: "pointer" }}
            className="hover-glow"
          >
            TrueSign OS
          </div>
          
          <div style={styles.navLinks}>
            <button 
              style={{...styles.navBtn, color: activeTab === "scanner" ? "var(--text-main)" : "var(--text-dim)"}} 
              onClick={() => setActiveTab("scanner")}
            >
              Scanner
            </button>
            <button 
              style={{...styles.navBtn, color: activeTab === "puppet" ? "var(--text-main)" : "var(--text-dim)"}} 
              onClick={() => setActiveTab("puppet")}
            >
              Puppet
            </button>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {activeTab === "landing" && <LandingPage onEnter={() => setActiveTab("dashboard")} />}
        {activeTab === "dashboard" && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === "scanner" && <SignToText />}
        {activeTab === "puppet" && <TextToSign />}
      </main>

    </div>
  );
}

const styles = {
  appShell: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  topNav: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    padding: "30px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 100,
    mixBlendMode: "difference", 
  },
  navLogo: {
    fontSize: "1.2rem",
    fontWeight: "700",
    letterSpacing: "0.1em",
    border: "1px solid var(--border-light)",
    padding: "10px 20px",
    borderRadius: "30px",
    color: "var(--text-main)",
    textTransform: "uppercase",
  },
  navLinks: {
    display: "flex",
    gap: "30px",
  },
  navBtn: {
    background: "transparent",
    border: "none",
    fontSize: "1.1rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "color 0.2s",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  mainContent: {
    flex: 1,
    paddingTop: "100px",
    paddingBottom: "40px",
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center", 
    justifyContent: "center",
  },
  landingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  logoWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  enterBtn: {
    background: "var(--text-main)",
    color: "var(--bg-dark)",
    border: "none",
    padding: "20px 40px",
    fontSize: "1.2rem",
    fontWeight: "600",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    borderRadius: "50px",
    cursor: "pointer",
  },
  dashboardContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    padding: "40px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "40px",
    width: "100%",
    maxWidth: "1000px",
  },
  hugeActionCard: {
    background: "transparent",
    border: "1px solid var(--border-light)",
    borderRadius: "20px",
    padding: "60px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    cursor: "pointer",
    textAlign: "left",
    position: "relative",
    overflow: "hidden",
  },
  cardNumber: {
    fontSize: "1.2rem",
    fontWeight: "700",
    color: "var(--text-dim)",
    marginBottom: "20px",
  },
  cardTitle: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "var(--text-main)",
    lineHeight: "1.1",
    letterSpacing: "-0.02em",
    marginBottom: "10px",
  },
  cardDesc: {
    fontSize: "1.1rem",
    color: "var(--text-dim)",
  }
};