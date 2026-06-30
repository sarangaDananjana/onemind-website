const fs = require('fs');
const path = require('path');

const portfolioPath = path.join(__dirname, 'public', 'portfolio.html');
let html = fs.readFileSync(portfolioPath, 'utf8');

// Update Hero Title
html = html.replace(
  /<h1 class="hero-headline">[\s\S]*?<\/h1>/,
  `<h1 class="hero-headline">
      Our<br>
      <em>Portfolio</em><br>
    </h1>`
);

// Update Hero Description
html = html.replace(
  /<p class="hero-desc">.*?<\/p>/,
  `<p class="hero-desc">Explore our selected case studies, client work, and digital experiences.</p>`
);

// Update Hero Actions
html = html.replace(
  /<div class="hero-actions"[\s\S]*?<\/div>/,
  `<div class="hero-actions" style="margin-top:32px;">
          <a href="#work" class="btn-primary">View Projects</a>
        </div>`
);

// Remove Marquee
html = html.replace(/<div class="marquee-section">[\s\S]*?<!-- ── SERVICES ── -->/, '<!-- ── PORTFOLIO CONTENT ── -->\n');

// Remove Services
html = html.replace(/<section id="services">[\s\S]*?<!-- ── PHILOSOPHY ── -->/, '<!-- ── PHILOSOPHY ── -->\n');

// Remove Philosophy
html = html.replace(/<section id="philosophy">[\s\S]*?<!-- ── PORTFOLIO: ENTERPRISE WORK ── -->/, '<!-- ── PORTFOLIO: ENTERPRISE WORK ── -->\n');

// Remove Tech Stack
html = html.replace(/<!-- ── TECH STACK ── -->[\s\S]*?<!-- ── TEAM ── -->/, '<!-- ── TEAM ── -->\n');

// Remove Team
html = html.replace(/<!-- ── TEAM ── -->[\s\S]*?<!-- ── CONTACT ── -->/, '<!-- ── CONTACT ── -->\n');

// Link Shan Mobile project to one of the portfolio items
html = html.replace(
  /<h3 class="portfolio-title">Aura Luxury Lifestyle<\/h3>/,
  `<h3 class="portfolio-title"><a href="/shan-mobile/" style="color: inherit; text-decoration: none;">Shan Mobile</a></h3>`
);
html = html.replace(
  /<p class="portfolio-desc">A highly visual, immersive e-commerce experience built for a premium lifestyle[\s\S]*?<\/p>/,
  `<p class="portfolio-desc">A beautiful, functional, and modern digital presence for Shan Mobile. Click to view the project details.</p>`
);

fs.writeFileSync(portfolioPath, html, 'utf8');
console.log('portfolio.html updated successfully.');
