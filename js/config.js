/*
 * Site configuration — edit this file to connect the site to your own tools.
 *
 * Every button marked with data-link="..." in the HTML is resolved from LINKS
 * below, so you only need to change a URL once. Leave a value as "" to fall
 * back to the on-site contact page.
 */
window.SITE_CONFIG = {
  brand: "Daniel Lambert",
  email: "daniel.lambert01@gmail.com",

  LINKS: {
    // Step 1 — free 20-minute discovery call (Calendly, Cal.com, etc.)
    discovery: "https://calendly.com/your-handle/discovery-call",

    // Step 4 — booking a paid session or package, per programme
    "book-executive": "https://calendly.com/your-handle/executive-coaching",
    "book-presentation": "https://calendly.com/your-handle/presentation-coaching",
    "book-interview": "https://calendly.com/your-handle/interview-coaching",
    "book-corporate": "", // corporate enquiries go to the contact form

    // Step 4 — payment links (Stripe Payment Links, PayPal, etc.)
    "pay-executive": "https://buy.stripe.com/your-executive-package",
    "pay-presentation": "https://buy.stripe.com/your-presentation-package",
    "pay-interview": "https://buy.stripe.com/your-interview-package",

    // Social / profile
    linkedin: "https://www.linkedin.com/in/your-profile"
  },

  // Indicative prices shown on the programmes page
  PRICES: {
    executive: "From €180 / session · 10-session package €1,650",
    presentation: "From €220 / session · 4-session sprint €820",
    corporate: "Tailored quote per team",
    interview: "From €160 / session · 3-session pack €450"
  },

  PROGRAMMES: {
    executive: "1:1 Executive Coaching",
    presentation: "Presentation & Pitch Prep",
    corporate: "Corporate Team Training",
    interview: "Interview & Career English"
  }
};
