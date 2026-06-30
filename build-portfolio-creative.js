const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'public', 'index.html');
const portfolioPath = path.join(__dirname, 'public', 'portfolio.html');

let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Extract the HEAD (including CSS) and FOOTER
const headMatch = indexHtml.match(/(<!DOCTYPE html>[\s\S]*?<\/head>\s*<body>)/);
const footerMatch = indexHtml.match(/(<!-- ── FOOTER ── -->[\s\S]*?<\/body>\s*<\/html>)/);

if (!headMatch || !footerMatch) {
  console.error("Could not parse index.html");
  process.exit(1);
}

const newBody = `
  <div class="cursor" id="cursor"></div>
  <div class="cursor-ring" id="cursor-ring"></div>
  <div class="grid-bg"></div>

  <!-- ── NAVIGATION ── -->
  <nav id="navbar">
    <a href="/" class="nav-logo">
      <img src="10001.png" alt="One Mind" class="nav-logo-img" />
      One Mind
    </a>
    <ul class="nav-links">
      <li><a href="/#services">Services</a></li>
      <li><a href="/portfolio.html" class="nav-cta-outline">Portfolio</a></li>
      <li><a href="/#contact" class="nav-cta">Start a Project</a></li>
    </ul>
  </nav>

  <!-- ── CUSTOM PORTFOLIO CSS ── -->
  <style>
    /* Creative Portfolio specific styles */
    .portfolio-hero {
      padding: 160px 48px 80px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .portfolio-hero-title {
      font-family: var(--font-display);
      font-size: clamp(64px, 8vw, 120px);
      font-weight: 800;
      letter-spacing: -0.05em;
      line-height: 0.9;
      background: linear-gradient(180deg, var(--white) 0%, rgba(255,255,255,0.4) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 24px;
      z-index: 2;
    }

    .portfolio-hero-subtitle {
      font-size: 16px;
      color: var(--grey-light);
      max-width: 500px;
      font-weight: 300;
      line-height: 1.6;
      z-index: 2;
    }

    .projects-showcase {
      padding: 40px 48px 160px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .project-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 40px;
    }

    .creative-card {
      position: relative;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 40px;
      overflow: hidden;
      transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 400px;
      text-decoration: none;
      color: inherit;
    }

    .creative-card::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at center, rgba(0, 71, 255, 0.15) 0%, transparent 50%);
      opacity: 0;
      transition: opacity 0.5s ease;
      transform: scale(0.8);
      z-index: 0;
      pointer-events: none;
    }

    .creative-card:hover {
      transform: translateY(-10px) scale(1.02);
      border-color: rgba(0, 71, 255, 0.4);
      background: rgba(255, 255, 255, 0.04);
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
    }

    .creative-card:hover::before {
      opacity: 1;
      transform: scale(1);
    }

    .card-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: auto;
    }

    .project-badge {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--cobalt);
      letter-spacing: 0.15em;
      text-transform: uppercase;
      padding: 6px 12px;
      border: 1px solid rgba(0, 71, 255, 0.3);
      border-radius: 40px;
      background: rgba(0, 71, 255, 0.05);
    }

    .project-arrow {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    
    .project-arrow svg {
      width: 14px;
      height: 14px;
      stroke: var(--white);
      transition: transform 0.3s ease;
    }

    .creative-card:hover .project-arrow {
      background: var(--cobalt);
    }

    .creative-card:hover .project-arrow svg {
      transform: rotate(45deg);
    }

    .card-bottom {
      margin-top: 40px;
    }

    .project-name {
      font-family: var(--font-display);
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }

    .project-summary {
      font-size: 14px;
      color: var(--grey-light);
      line-height: 1.6;
      font-weight: 300;
    }

    /* Animated background glow */
    .glow-orb {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(0, 71, 255, 0.1) 0%, transparent 70%);
      border-radius: 50%;
      top: -200px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 1;
      filter: blur(40px);
    }
  </style>

  <section class="portfolio-hero">
    <div class="glow-orb"></div>
    <h1 class="portfolio-hero-title">Selected<br>Works.</h1>
    <p class="portfolio-hero-subtitle">
      A showcase of projects built natively in our workspace. Fluid, dynamic, and crafted for impact.
    </p>
  </section>

  <section class="projects-showcase">
    <div class="project-grid">
      
      <!-- Shan Mobile Project -->
      <a href="/shan-mobile/" class="creative-card">
        <div class="card-content">
          <div class="card-top">
            <span class="project-badge">Mobile Experience</span>
            <div class="project-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
          <div class="card-bottom">
            <h2 class="project-name">Shan Mobile</h2>
            <p class="project-summary">A completely custom web and mobile experience featuring immersive transitions and dynamic routing.</p>
          </div>
        </div>
      </a>

      <!-- Placeholder for future projects to show the layout -->
      <div class="creative-card" style="opacity: 0.5; cursor: default;">
        <div class="card-content">
          <div class="card-top">
            <span class="project-badge" style="border-color: rgba(255,255,255,0.1); color: var(--grey); background: transparent;">Coming Soon</span>
          </div>
          <div class="card-bottom">
            <h2 class="project-name">Next Project</h2>
            <p class="project-summary">Your next big idea will live here. Add folders to the projects directory to expand your portfolio.</p>
          </div>
        </div>
      </div>

    </div>
  </section>
`;

const finalHtml = headMatch[1] + newBody + footerMatch[1];
fs.writeFileSync(portfolioPath, finalHtml, 'utf8');
console.log('portfolio.html completely redesigned!');
