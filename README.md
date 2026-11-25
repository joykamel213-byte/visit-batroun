# Uncover Batroun: QR landmark website

A one-file website (`index.html` + the `images` folder). Every landmark has its own page:

| Landmark | Page address (add after your domain) |
|---|---|
| Phoenician Wall | `#phoenician-wall` |
| Our Lady of the Sea | `#our-lady-of-the-sea` |
| Saint Stephen's Cathedral | `#st-stephen` |
| Saint George's Church | `#st-george` |
| The Old Souk | `#old-souk` |
| Mseilha Fort | `#mseilha-fort` |

Example: `https://your-domain.com/#phoenician-wall`

## Try it on your computer
Double-click `index.html`. It opens in your browser (internet needed for fonts and the QR library).

## Put it online (free options)
Any static host works, no server code needed:
- **Netlify Drop** (app.netlify.com/drop): drag this whole folder onto the page.
- **GitHub Pages** or **Cloudflare Pages**: upload the folder as a site.

## QR codes
Open `your-domain.com/#qr-codes` once the site is online. The codes there point to that address automatically.
Print them (button on that page) and place each one at its landmark.

## Voiceover
The story is read aloud by the phone's own text-to-speech voice, in English, Arabic or French. It is free and needs no audio files.
Quality depends on the phone; iPhones and most Android phones include all three languages.
To use recorded or AI-generated audio instead, put MP3 files in an `audio` folder and add a line to that landmark in `index.html`, for example:

    audio: { en: "audio/phoenician-wall-en.mp3", ar: "audio/phoenician-wall-ar.mp3", fr: "audio/phoenician-wall-fr.mp3" },

The page then plays the file and highlights the text as it goes.

## Add or edit a landmark
In `index.html`, find `const LANDMARKS = [`. Copy one landmark block, give it a new `id` (this becomes its address),
coordinates (`lat`, `lng`, from Google Maps: right-click the spot), names, story sentences in the three languages, and photos.
Nearest landmarks, distances and travel times are calculated automatically from the coordinates.

## Photos
Current photos come from Wikimedia Commons under free licences. The credits are shown in each page's footer, as the licences require. Replace them with your own photos any time (same file names, or edit the `images:` lines).
