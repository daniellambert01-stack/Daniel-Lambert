# Daniel Lambert — Executive English Coaching website

A static site with no build step: plain HTML, CSS and JavaScript. Open `index.html` in a browser, or host it on GitHub Pages, Netlify or any static host.

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Home: problem, approach, programmes, process, FAQ |
| `programmes.html` | The four programmes, with booking and assessment links for each |
| `process.html` | The six-step client process, with each step linked to where it happens |
| `assessment.html` | On-site intake and level assessment (step 2), which hands off to booking |
| `book.html` | Booking and payment (step 4); the client's programme is shown first |
| `about.html` | Biography (edit with your own details and photo) |
| `contact.html` | Contact form that opens a pre-filled email; handles invoices, corporate proposals and rescheduling |

## The client process and where it links

1. **Discovery call**: every "Book a Call" button goes to `LINKS.discovery`.
2. **Assessment**: `assessment.html`. Results are saved in the visitor's browser, the client can email them to you, and their name and email are prefilled into your booking links.
3. **Coaching plan**: sent by you after the call.
4. **Book & pay**: `book.html` goes to `LINKS["book-*"]` (scheduling) and `LINKS["pay-*"]` (card payment), or to an invoice request.
5. **Coaching sessions**: rescheduling goes through `contact.html?topic=reschedule`.
6. **Progress review**: `assessment.html?review=1`.

## Connect your own tools

Edit **`js/config.js`**. It is the only file you need to change:

- `LINKS.discovery`: your free discovery-call link (Calendly, Cal.com, etc.)
- `LINKS["book-executive" | "book-presentation" | "book-interview"]`: paid booking pages
- `LINKS["pay-executive" | "pay-presentation" | "pay-interview"]`: Stripe Payment Links, PayPal, etc.
- `LINKS.linkedin`, `email`, `PRICES`

If you leave a link as `""`, the button falls back to the contact page.

## Publish on GitHub Pages

Go to Settings → Pages → Deploy from a branch, and choose this branch with `/ (root)`.
