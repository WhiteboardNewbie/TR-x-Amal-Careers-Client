# Amal branding

The public board uses Amal Academy’s identity. Branding is built into this client. There is no theme settings screen.

[amalacademy.org](https://www.amalacademy.org/) stays the Squarespace marketing site. “Careers at Amal” in that nav links to this public board. The Squarespace path `/careers` currently returns 404.

## Copy already on the public site

- Name: Amal Academy
- Line: Empowering Pakistan’s youth through developing soft skills and mindsets.
- Email: hello@amalacademy.org
- Phone: +92 301 845 4761
- Address: 259-B Khizer Road, Upper Mall, Lahore, PK 54000
- Careers label: Careers at Amal

## Colours

The names below are the palette. Hex values live here and in `app/globals.css`. Do not add a fifth public-board colour.

| Name | Hex | RGB | Token | Use |
| --- | --- | --- | --- | --- |
| Red | `#FF3333` | `255, 51, 51` | `--amal-red` | Public-board accent: Sign in, active filter, card edge, View role, back-to-top |
| Blue | `#334CFF` | `51, 76, 255` | `--amal-blue` | The small triangle in the lockup only |
| Black | `#000000` | `0, 0, 0` | `--amal-black` | Strong type |
| White | `#FFFFFF` | `255, 255, 255` | `--amal-white` | Page and card surfaces |

Staff banners are the ERP card: rounded, padded, in the page. Gradient is `--amal-staff-banner` (Amal red mixed 38% into black) into `--amal-red`, left to right. Do not use a second maroon.

Do not use:

- Blue as a header bar, button, or link
- The white lockup on a white page
- TeleRelation navy `#002060` / `#002B5C`

In components, use the token (`text-amal-red`, `var(--amal-red)`). Do not paste a hex.

## Logo

The lockup is `public/amal-wordmark.png`, from `Amal Website_Social Sharing Logo.png` on the live site. It is one file: a red triangle, a blue triangle, and AMAL over ACADEMY in black, with a transparent field. Header and footer show that file.

The logo is not a colour. Red and blue inside it still follow the table above.

## What branding covers

- Public board: name, logo, colors, hero, and the Lahore contact line
- Staff banners (ERP-style card gradient on staff screens)
