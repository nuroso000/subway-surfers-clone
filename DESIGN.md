# Subway Rush design

## Direction
The user's explicit reference is Subway Surfers. Its colorful arcade composition takes priority over the global Apple-inspired visual default. Apple interaction principles inform responsiveness, focus, gesture capture, clear status and reduced optional motion, without changing this into an Apple-styled utility app.

Considered: the original split editorial landing screen; a centered arcade title over the playable world; and a framed portrait arcade cabinet. Selected: centered title and full-viewport world, with portrait-aware camera framing and sparse corner gameplay controls. This keeps the tracks central and transitions directly into play.

## References
- [Pocket Gamer original gameplay screenshot](https://media.pocketgamer.com/artwork/na-hmqi/subway-surfers-ios-1.jpg), visually inspected: three-track vanishing point, close rear camera, small top-corner HUD and red boundary walls.
- [Subway Surfers gameplay reference](https://cdn.tfrv.xyz/subway_surfers/thumbnails/5.png), visually inspected: saturated train colors, clearly contrasting gold coin paths, rooftop play and striped obstacles.
- [SYBO power-up documentation](https://sybo.helpshift.com/hc/en/5-subway-surfers/faq/209-power-ups/), read as a mechanics reference, not visual evidence.
- A WordPress-hosted reference image failed to display and was not used as visual evidence.

No reference images, game models or branding files are bundled. The title, models, character geometry, texture signs and graffiti are independently authored. This is a fan-inspired prototype, not the full original game.

## Tokens
Sky #83d5f6; blue #188cdb; ink #173758; gold #ffcd29; warm white #fff9e7; coral #ee513e. Scene colors also include terracotta walls, sand-colored ballast and green trees.
Display: Impact/Arial Black, slanted and outlined to echo painted arcade lettering. Interface: Arial Rounded MT Bold/Trebuchet MS/Arial. No font downloads.
Spacing: 4/8/12/16/24/32 px, adjusted for narrow screens. Controls at least 44 px for core touch actions. Radii: 12–17 px secondary controls, 21 px primary action, 25–27 px dialogs.

## Layout and interaction
Home: compact top sound/wallet controls, centered title above the runner, bottom play action with runner selection and instructions. Gameplay: pause left, score/coins right, mission left, power-up timers and board action at the bottom. Touch direction buttons supplement swipes. On narrow screens, the camera pulls back to keep both outer lanes visible.
Input interrupts lane interpolation; swipes commit at a short movement threshold rather than waiting for release. Jump/roll/board actions provide immediate feedback. Optional sound starts only after user interaction. Dialogs use visible focus; result-screen focus cycles within its actions.

## Imagery and motion
All 3D assets are procedural geometry; static meshes are merged by material, geometry is shared, and pixel ratio is capped. No external images or artificial testimonials.
Running, lane changes, falling and obstacle motion are essential gameplay. Reduced motion removes idle bobbing, collectible rotation, flashing grace effects and pickup particles. Reduced transparency uses opaque controls. Background tabs pause the run.

## Verification
Core simulation tests cover lane limits, jumping, rolling, ramp-to-roof transitions, collisions, hoverboard protection, magnets, jetpack landing, jump/score boosts, reset/pause and clear-lane spawning. Browser checks include actual rendered screenshots at desktop and mobile sizes, startup errors, pause/resume and input. This does not represent an exhaustive test of every possible procedural combination or physical mobile device.

## Fullscreen and track clearance update
Added a 44 px fullscreen toggle alongside sound/pause; narrow-screen score typography leaves room for all three controls. The button uses actual fullscreen state and adapts when fullscreen is exited externally. Unsupported browsers get a home-screen-launch explanation rather than simulated fullscreen. A web manifest and Apple standalone metadata support launching without browser chrome where available; there is no offline cache.

Traffic now resolves front-to-back per lane with a three-unit buffer before solid objects. Train roof support and collision share the same longitudinal bounds. All overhead structures derive from a shared clearance specification: the jetpack's eight-unit foot height plus the full runner height plus 1.5 units of clearance. This covers ascent/descent as well as sustained flight.

Verified 17 simulation/clearance tests, production build, browser fullscreen entry/exit, and a 360×800 gameplay screenshot. No physical iPhone or Android device was available for verification. Fullscreen implementation follows https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen .
