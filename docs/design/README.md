# Approved design archive

Central workspace archive: `design/approved/`. Website approvals are also versioned here for repository reviewers. Every newly approved module must retain its approved mockup, prompt, approval record and implementation reference in its own module/version folder before coding. Drafts stay outside the approved folder. Preserve earlier approved versions.

Homepage v2 was approved by Sarkhan on 1 November 2026. The image and prompt are stored under `approved/homepage/v2/`. Implementation uses accurate licensed local photographs rather than generated landmarks. Existing sample itineraries and supported functionality take precedence over illustrative mockup copy.

Homepage copy: `lib/homepage-content.ts`. Layout: `components/homepage.tsx`. Scoped styles: `app/homepage.css`. Navigation/footer integration: `components/travel-site.tsx`.

Verification: production build, TypeScript and localization check; browser desktop/mobile EN/RU/AZ; discovery filters; search date and traveler count carried to the tour builder; FAQ interaction and mobile menu. No real payments or external messages are sent.

New photo sources (CSS crops; original JPEGs retained):

- `public/images/tea.jpg`: Interfase, Tea in Azerbaijani national Armudu glass, CC BY-SA 3.0. https://commons.wikimedia.org/wiki/File:Tea_in_Azerbaijani_national_Armudu_glass.jpg — https://creativecommons.org/licenses/by-sa/3.0/
- `public/images/gabala.jpg`: Nigar O.Mammadova, Nohur Lake, Gabala, CC BY-SA 4.0. https://commons.wikimedia.org/wiki/File:Nohur_Lake,_Gabala.jpg — https://creativecommons.org/licenses/by-sa/4.0/

Existing Baku, Sheki and Khinalug credits remain on the website's Credits page and footer. Image licenses apply to photographs; no endorsement by photographers is implied.

## Imagery correction v3

At Sarkhan's request, homepage photography now follows the approved generated concept. Eight built-in GPT Images assets are in `public/images/homepage-v3/`; prompts are archived in `approved/homepage/v2/photo-prompts-v3.json`. They are rendered with responsive Next.js Image optimization. A localized on-page note identifies generated illustrative imagery. Original documentary assets/credits are retained for other pages. The central design archive preserves all eight generated originals under `design/approved/homepage/v2/imagery-v3/`.

## Approved tour pages v1

Sarkhan approved the desktop/mobile catalog and detail concepts on 1 November 2026. The four accepted PNGs, exact generation/refinement prompts and approval record are in `approved/tours/v1/`. Implementation uses `components/tour-experience.tsx`, `app/tours.css`, translated content in `lib/tour-content.ts` and URL-backed discovery in `lib/tour-discovery.ts`. All tour photography uses the generated homepage assets, with localized illustrative-imagery disclosure. Implementation screenshots are preserved in the central `design/approved/tours/v1/` archive.

See `approved/tours/v1/implementation.md` for behavior and validation. These pages customize a trip before the existing registration/operator-review flow; they do not implement live payments, contracts or staged payment requests.
