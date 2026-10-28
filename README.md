# Momentum

A one-on-one rooftop fighter. Consecutive player hits raise damage from 10 to 20; taking a hit breaks the streak. Both in-arena fighters use full-body rendered character poses matching their portraits.

## Run locally

Open a terminal in the repository folder, beside index.html:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000 in a desktop browser. There is no install or build step. Keep the terminal running; Ctrl+C stops the server. Use HTTP because the game loads JavaScript modules and local animation metadata.

## Controls

| Input | Action |
| --- | --- |
| Enter or Fight | Start |
| A/D or left/right arrows | Move |
| J | Attack; press once per strike |
| K | Dodge in the held direction, or away if no direction is held |
| Escape | Pause/resume |
| R, after game over | Restart |

Sound, fullscreen, pause, and dodge also have buttons. The game pauses when its tab loses focus. Dodge has a one-second cooldown and a short invulnerability window; it suppresses attacks while active. Normal movement and dodges stop at the arena edges and opponent body spacing.

Watch the rival draw its fist back and the gold warning appear. Dodge or leave its range, then attack during recovery. Holding J or K does not repeat those actions. The infinity symbol means the round has no time limit; the small clock measures elapsed play.

## Verification

```sh
npm test
```

No dependencies need installation. All **16 engine tests pass**, covering damage progression and its cap, misses, recovery, incoming damage/reset, enemy windups, late range checks, simultaneous KO, frozen game-over state, fresh state, boundaries, losing by mashing, winning by counterattacking, body spacing, dodge immunity/cooldown/expiry, and pause behavior.

Browser QA checked asset loading, both full-body avatars during play, movement, a successful punch, health/streak updates, and dodge cooldown feedback. JavaScript syntax and local asset paths were checked.

## Acceptance report

Numbers refer to the unchanged SPEC.md. Complete describes the implemented behavior; partners should still perform their own playtest.

| # | Status | Implementation |
| --- | --- | --- |
| 1 | Complete | Run instructions and movement/attack/dodge/start/restart controls. |
| 2 | Complete | Fresh health 100, streak 0, next damage 10. |
| 3 | Complete | Both movement key pairs, auto-facing, arena limits. |
| 4 | Complete | Range check and one hit per attack activation. |
| 5 | Complete | Attack recovery and keyboard repeat filtering. |
| 6 | Complete | K dodge, direction, cooldown, and attack suppression. |
| 7 | Complete | Invulnerability checked when the enemy strike resolves. |
| 8 | Complete | Approach, windup, recovery, escape and balance playtests. |
| 9 | Complete | 10/12/14/16/18/20 damage progression and cap. |
| 10 | Complete | Enemy damage 25; hit resets momentum; misses/dodges preserve it. |
| 11 | Complete | Win/loss/draw, zero-health clamp, combat stops. |
| 12 | Complete | Restart clears match state, inputs and effects. |
| 13 | Complete | Matching original rendered portraits and full-body avatars. |
| 14 | Complete | Health, streak, next damage, and dodge readiness. |
| 15 | Complete | Windup/punch/hit/evade poses, hit effects and reset feedback. |
| 16 | Complete | Hit and movement sounds, mute, and streak accent. |

## Code map

| File | Responsibility |
| --- | --- |
| src/config.js | Arena, timing, damage, spacing, and movement values |
| src/engine.js | Match state, combat, momentum, dodge, and results |
| src/ai.js | Opponent approach/windup/recovery |
| src/input.js | Keyboard movement and one-frame action requests |
| src/atlas.js | Load and isolate grounded animation poses |
| src/render.js | Arena, fighter poses, afterimages, and hit effects |
| src/main.js | Menus, loop, HUD, pause, sound/fullscreen buttons |
| src/audio.js | Short generated sound effects and mute state |
| assets/fighters-atlas.json | Pose outlines, bounds and foot anchors |
| tests/engine.test.js | Deterministic combat tests |

The sprite pose order is guard, walk A, walk B, windup, punch, recovery, hit, evade. Both fighters share this order. The renderer mirrors the rival as needed and derives pose selection from combat state. Generated poses sometimes extend beyond grid cells; per-pose outlines prevent neighboring characters appearing in a frame.

## Limits and handoff work

These are prerendered 2D avatars with eight discrete poses each, not live rigged 3D models. Walking frames and transitions can be refined; frame blending and more consistent locomotion are useful next improvements. Controls target a desktop keyboard; online play, gamepad support and a rotating camera are outside this build.

The engine and visual renderer remain separate. A partner can improve animation or replace the art without rewriting damage, streak, dodge or opponent behavior. Keep the numbered acceptance report and PROMPT_LOG.md current.

## Add this build to the existing GitHub repo

Copy the package contents into the existing repo, beside the first-commit SPEC.md. The package contains no .git directory, no remote settings and no hosting identity. SPEC.md is included unchanged.

```sh
git add index.html styles.css src assets tests package.json README.md PROMPT_LOG.md ART_DIRECTION.md .gitignore
git commit -m "Build Momentum avatars and arena"
git push
```

ART_DIRECTION.md contains the exact image-generation prompts, mode and asset paths. PROMPT_LOG.md records the relevant user requests and accepted changes.
