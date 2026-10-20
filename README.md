# Midnight Castle — four connected realms

The default `index.html` now opens a freely controlled, modeled 3D world. It no longer uses the illustrated room as the playfield. The earlier image-based castle and archive remain available at `illustrated.html`; the oldest slideshow remains in `legacy/`.

- **Drowned Cathedral:** central nave, shallow water, a rose window, writing stations, an eastern stair and an upper cabinet.
- **Ashen Library:** western wing, tall shelves, hanging lights, drifting ash, suspended rubble, a separate staircase and a second-floor archive.
- **Winter Observatory:** eastern snow-covered rotunda, iron dome ribs, brass armillary, sliding drawers. Approach the celestial mechanism and press E to start/stop its rings.
- **Moonlit Conservatory:** southern bridge, modeled glasshouse roof, climbing plants, moonflowers, letters and a garden cabinet.

These environments share one scene and continuous movement. **Realms & Routes** provides guided walking paths; movement keys interrupt them. WASD moves, arrows walk/turn, dragging turns the camera, Shift sprints, Space jumps, and E interacts with nearby world objects. The camera boom shortens near obstacles. Stair heights are physical floor heights; there is no scripted climb animation in this version. Library stairs rise to Y=4, cathedral stairs to Y=3.6. Approach a cabinet and open individual drawers to read/write letters.

Mira and Theo now use hooded traveler rigs with armor, leather gear and a folded animated cape. Pip, Miso and Ember remain available. The sound button enables a locally synthesized wind/room tone and footsteps; it starts muted. No external audio is fetched.

The existing unique-read/write stardust, mode progress, journal and local rewards are retained. Letters stay on this device. There is no public message service, live leaderboard, paid reward, combat, or multiplayer. This is a procedural browser prototype, not an AAA game or a photorealistic reconstruction.

New implementation: `exploration.js`, `exploration-expedition.js`, `realms.js`, `realms.css`, `wanderers.js`, `soundscape.js`. Three.js remains vendored locally under its MIT license. The published entry now loads a checked-in, cache-versioned bundle. Run `npm ci`, `npm run build` and `npm test` after editing source before pushing. esbuild is a development-only dependency; the deployed game needs no runtime package downloads or import-map support. Existing artwork provenance is retained below.

Browser verification covered walking between all four areas, starting/stopping the observatory, library ascent to Y=4 and descent, cathedral ascent to Y=3.6, individual upper drawers, reading for +5 stardust, writing for +20 and quest progress, manual on-screen movement, and the character picker/controls at 320 × 740. A fresh final desktop load reported no console errors. HTML IDs are unique and syntax checks pass for all five new JavaScript modules. The tests left one additional kind local letter in the playtest drawer; no rewards were spent.

**Watch & Learn** opens an 87-second live self-playing tutorial, with nine selectable chapters, pause/resume, previous/next, replay and Take Control Here. Space pauses, arrows change chapters and Escape exits. It demonstrates real movement, running/jumping, stairs, drawer animation, sample reading/writing, all travelers, a seal, the observatory, other realms and rewards. It is an in-engine demonstration, not a prerecorded video. Demo letters/awards are labeled examples; they never enter letter storage. Traveler/quest saves are suspended during the demo, and their original state is restored on exit. Existing open drawers and the observatory state are restored too. The tour pauses when the tab is hidden. Verification covered automatic completion, pause and chapter selection, phone playback at 320 × 740, Take Control Here, and exit/reload with the same traveler, stardust, journal count and quest progress. No browser console errors occurred during the tested tour. `demo.js` and `demo.css` implement the player and chapter UI.

Startup now keeps the interface behind a loading cover until a 3D frame actually renders. It reports interrupted downloads/initialization failures with retry, lighter graphics and copyable diagnostics. Blocked storage getters no longer crash the letter module. If the high-performance graphics context fails, startup retries with lighter renderer options. `?graphics=lite` disables shadows, reflection and bloom, lowers precision/pixel density, and limits nearby point lights. Nine regression tests cover inaccessible/corrupt storage, graphics fallback, loading readiness and visible failures. Normal and lightweight rendering and tutorial movement were verified in the browser.

Serve the workspace and open `http://localhost:8765/midnight-castle/`.

---

## Earlier build notes and artwork provenance

# The Midnight Castle — continuous 3D version

## Travelers and adventures

Choose **Mira** (girl), **Theo** (boy), **Pip** (dog), **Miso** (cat), or **Ember** (fox) using **Your Traveler**. The picker previews the actual animated 3D model. Inside, the follow camera shows your chosen traveler walking, running, climbing, breathing, blinking, and reaching for drawers. Animal tails animate too. Switch to first person in the camera settings if preferred.

**Your Way to Play** offers Wander, The Letter Keeper, and The Five Lost Seals. Wander has no checklist. The Letter Keeper tracks three different letters read and two original letters left. Reading a letter already counted in the quest does not advance it; stardust still follows the existing unique-read rules. Treasure Hunt places five collectible seals in the 3D world, including the upper archive. Completing either quest grants a visible crest around the traveler. Use Start This Quest Again in the mode picker to replay without removing letters, stardust, or earned crests. Choices and quest progress are saved locally.

**Explore the Keep → The Whispering Archive** opens the exact approved room illustration. Click **Go upstairs** on the pictured left staircase (or press W / ↑). The animated traveler follows a spatial stair route to a landing four world units above the floor. Click **Go downstairs** or press S / ↓ to return. There are 45 individual wall drawers and four counter drawers with modeled sliding trays. The top four wall rows require the landing; the lower wall rows and counter are downstairs. Clicking an upstairs drawer from the ground floor starts the stair route automatically. Read or leave a letter through its contents panel. **Room view** restores the overview; **Castle gate** returns home.

This room is an image-based diorama with animated 3D travelers, drawers and bounded guided cameras. Its background architecture remains the original illustration, rather than a fully reconstructed freely explorable 3D room. `archive-room.js` and `archive-room.css` implement this view.

**Explore the Keep → The Keep Gallery** retains the freely walkable procedural courtyard and eastern staircase. That gallery is 3.6 world units above ground with rail collisions, butterflies, a celestial mobile and six additional sliding drawers. Manual movement cancels guided walking there.

The traveler rigs now include smaller facial features, connected limbs, textured clothing, folded capes, leather packs and straps, brass details, blinking and animated steps; animal travelers retain moving tails, with added cat whiskers.

Browser verification covered choosing Theo and Pip, saved choice/mode/seal restoration, climbing to the upper floor with the dog, collecting an upstairs seal, opening a physical upper drawer and reading its letter, completing the letter quest, and ensuring duplicate submissions did not advance that quest. Public sharing remains outside this local playtest.

The approved original castle/home artwork and interface are retained at the entrance. Walking, turning, collision, jumping, sprinting, approach interactions, and travel through the doorway now run in a local Three.js/WebGL scene. The original slideshow version is preserved in `legacy/`.

The entrance is an image-based 3D projection of the approved castle illustration, with depth on the bridge and an opening into the modeled interior. This preserves its appearance from the home viewpoint; it is not a complete 3D reconstruction of every illustrated building. Inside is procedural geometry: gothic arches, a cloister, writing desks, letter plinths, a reflective pool and wishing tree, and an unlockable stair and terrace. It is a browser prototype, not an AAA-quality game.

`world.js` renders and controls the connected space. `letters.js` supplies the existing local letter, journal, point, and reward flow. `world.css` adds the 3D controls while retaining the approved home header. `vendor/package/` is the official Three.js 0.170.0 package from the npm registry, including its MIT license. There is no build step.

Use WASD to walk, drag to look, Shift to run, Space to jump, and E to interact nearby. The on-screen arrows physically move the camera through the doorway. Manual movement cancels guided walking. Full screen, mouse locking, sensitivity, and visual-quality settings are available.

Additional asset `assets/stone.jpg` was generated with the built-in image tool: a seamless photorealistic orthographic diffuse scan of weathered grey limestone ashlar blocks in staggered rows, with pitted mineral texture, chipped bevels and subtle moss in mortar joints; uniform flat light, no perspective, external shadows, objects, text, UI, or watermark. The material is applied to actual modeled surfaces.

Latest pictured-room verification: desktop and 320 × 740 phone layouts; staircase arrival at Y=4; ground-floor wall and counter drawers; upstairs drawer contents; drawer-to-letter action; actual model preview; no browser console errors. The original room art is unchanged.

The notes below describe the preserved original version and its artwork.

A standalone, playable first-person point-and-click castle experience. Serve this folder with a static HTTP server and open `index.html`. The existing workspace server serves it at `http://localhost:8765/midnight-castle/`.

Move with the on-screen arrows, left/right arrow keys, or A/D. Click the open castle door to enter the archive. Click the M to open the room map. The full-screen control requests browser full screen when supported.

## Implemented

- Four illustrated environments: moonlit gate, whispering archive, starlit observatory, and unlockable Moonroof.
- Interactive envelopes, drawers, memories, writing desk, telescope, and reward chest.
- Sealed random letters with an opening animation, anonymous writing, and a personal journal.
- Five stardust for each previously unread sample letter and twenty for each distinct submitted letter. Reading your own letters or repeating a letter does not award points.
- Spend stardust on a floating lantern companion (25), repeatable meteor-shower cosmetic (50), and secret rooftop room (90).
- Validated progress restored from localStorage; wallet derived from earned points minus redeemed rewards. Duplicate submissions cannot farm points.
- Keyboard and touch controls, native modal focus management, responsive object dock, reduced-motion support, and text-safe letter rendering.

## Playtest boundary

This is a complete local UI/UX game with sample messages. Letters, journal, and progress are stored in the browser. There is no live public message pool, multiplayer ranking, or monetary reward. The interface labels this explicitly. A public release needs a shared message service with moderation and reporting, server-side reward accounting, and abuse limits. No third-party message transmission is performed here.

## Art provenance

Generated using the built-in image-generation tool. JPEGs are format-compressed copies; originals are preserved. Project assets:

- `assets/castle.jpg`: first-person, wide cinematic moonlit gothic castle entrance; a bridge, open amber-lit doors at center, an ivory wax-sealed envelope on the left parapet, a brass star chest on the right, blue crescent moon, misty mountains, fireflies and pale flowers. Sophisticated painterly realistic cozy-fantasy environment; no people, text, UI, or watermark.
- `assets/observatory.jpg`: first-person wide midnight gothic observatory with arched windows, violet-blue Milky Way and crescent moon; brass telescope right, ivory parchment and quill on a foreground walnut desk left, iridescent orb on a pedestal center, velvet, celestial instruments, art-nouveau brass inlay, hanging star mobiles. Cinematic cozy fantasy, no people, text, UI, or watermark.
- `assets/roof.jpg`: wide secret gothic rooftop garden floating above clouds; marble terrace, iron railings and spires framing violet-teal aurora and crescent moon, magical luminous flowering tree, little brass writing desk and paper left, fireflies, moonflowers and golden lanterns. Detailed painterly realistic romantic cozy fantasy, no people, text, UI, or watermark.
- `assets/archive.jpg`: the earlier generated midnight curiosity shop from this conversation, with a hovering sealed envelope, bottled orchard, firefly matchbox, dream teacup, and brass drawers under a crescent moon window.

No package installation or build step is required. Google Fonts are optional; local serif and sans-serif fallbacks are supplied.


## Nightfall Defenders

An optional campaign launched from the visible Nightfall button or the mode picker. Peaceful exploration and its stardust/rewards are unchanged. About explains both play styles.

- Seven sequential story chapters across the existing modeled realms. Each has three shadow waves, shield and letter integrity, a prism blaster, projectile collisions, eight-shot magazines, and reloads. Click a shadow to aim, or use F/the fire button for assisted aim. WASD/arrows move, drag looks, Space jumps, and R reloads. Leaving returns to the original exploration position.
- Read and keep the rescued story page to finish a chapter: 40 embers on first completion, 12 on replays. Completed pages can be reread without another battle or extra payment. Closing a letter never claims its reward.
- A separate walkable room has three free palettes, five optional decorations, a faster-reloading blaster core, glowing rescued-page frames, and a seven-light completion crest. Unlocking furniture spends embers once; displaying/hiding it is free.
- Endless Watch unlocks after chapter 3, awards 10 embers per completed wave, and preserves earnings on defeat. It has a local best-wave score, not a shared leaderboard.
- Watch Combat Demo runs a computer-controlled siege with movement, firing, reloads and a rescued page. It awards nothing and never changes campaign or room progress. Play This Siege starts a fresh real mission. The original 87-second exploration tutorial remains available.
- The local save key is `midnight-nightfall-v1`. No public letter backend, accounts, multiplayer, payments or real-world rewards are introduced. Optional synthesized combat sound follows the existing sound preference.

Validation: `npm test` includes progression ordering, purchases, replay rewards, corrupt-save handling and continuous projectile collision checks. Browser playtests cover the seven chapter victories, demo isolation, saved room purchases, and camera controls.
