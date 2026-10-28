# MOMENTUM
## 15-114 game specification

Working title: **Momentum**. This document describes the finished game, including features that may still be missing after Phase 1.

## 1. The game

Momentum is a small, single-player, side-view fighting game. The player moves around one arena, dodges an opponent's attacks, and lands close-range hits. Consecutive successful hits increase the player's damage. Taking a hit removes that bonus.

The fun is deciding whether to keep attacking for a stronger streak or retreat before the opponent breaks it. The combat should feel responsive and understandable to someone who does not normally play fighting games.

The visual appeal matters too. Expressive character portraits sit beside the health bars, while simple figures perform the actual fighting. The characters should have attractive, expressive faces, distinctive styled hair, and feminine and masculine designs with athletic physiques, including lean muscle definition. The portraits carry the detail; the combat figures need clear poses and contrasting colors.

### Design decisions and defaults

The central choices are real-time movement and combat, portraits beside simple fighters, and a damage streak lost when hit. The controls, numerical values, and working title below are initial defaults to review before committing this spec. They provide a complete starting point rather than requiring the next developer to invent the rules.

## 2. Intended scope

The complete game includes:

- One human-controlled fighter against one simple computer-controlled opponent.
- One flat arena, horizontal movement, one melee attack, and one dodge.
- Health bars, a streak counter, and the damage of the next player hit.
- An opponent whose attacks have a visible warning.
- Two distinct character portraits, one for each fighter.
- Clear hit, dodge, streak-reset, and game-over feedback.
- An instructions/start screen and the ability to restart a finished match.

There is no jumping, blocking, complex combo input, character roster, online multiplayer, story campaign, or equipment system. These would expand the project beyond the available build time.

Recommended implementation: JavaScript with a canvas and ordinary HTML/CSS, runnable locally without an account or backend. The implementer may use another simple setup if the README explains how to run it.

## 3. Controls and match flow

| Input | Action |
| --- | --- |
| Enter | Start from the instructions screen |
| A / D or left / right arrows | Move left / right |
| J | Perform one melee attack |
| K | Dodge |
| R | Restart after the match ends |

Show the controls on the instructions screen and a short reminder during play.

Both fighters start with 100 health, separated inside the arena. The player automatically faces the opponent. Neither fighter can leave the arena.

An attack hits only if the opponent is within melee range when the attack connects. Each activation can damage the opponent once. Attacks have a brief recovery period; holding a key or pressing repeatedly during recovery must not create extra hits.

Dodging moves the player a short distance in the held movement direction. With no direction held, it moves away from the opponent. During the short dodge window, incoming attacks do not damage the player. Dodging has a cooldown and cannot be held for continuous invulnerability. The player cannot attack during a dodge.

Initial timing targets are approximately 0.5 seconds between player attacks, a 0.2-second dodge window, and 1 second between dodges. Timing and movement distances may be tuned for playability. Make dodge readiness visible.

When a fighter reaches zero health, stop combat and display a win or loss message. If both reach zero in the same update, display a draw. Restart returns to the original positions and health with all streaks, pending attacks, and cooldowns cleared.

## 4. The momentum rule

Let the streak be the number of successful player hits since the player last took damage. It starts at zero.

| Streak before the hit | Damage of that hit |
| --- | --- |
| 0 | 10 |
| 1 | 12 |
| 2 | 14 |
| 3 | 16 |
| 4 | 18 |
| 5 or more | 20 |

Apply damage using the current streak, then increase the streak by one. The displayed streak may keep increasing, but damage stays capped at 20.

- Taking actual damage immediately resets the player's streak to zero.
- Missing an attack does not increase or reset the streak.
- Walking, waiting, or successfully dodging does not reset it.
- A dodged attack causes no damage and therefore no reset.
- The computer deals a fixed 25 damage per successful hit and has no streak bonus.

Always show both the current streak and the next hit's damage. A visible flash, counter animation, or short message should make a lost streak noticeable.

## 5. Computer opponent

The opponent approaches when outside melee range. When close enough and ready, it visibly prepares an attack, then strikes after a short windup. An initial target is about 0.5 seconds of warning, followed by 0.5 seconds of recovery.

Determine whether the attack hits when it resolves, using the player's current position and dodge state. Starting an enemy attack must not guarantee damage. The player can escape its range or dodge it.

The opponent may remain stationary during its windup. Normal player hits do not cancel an attack that has already started. This keeps its behavior readable and prevents the player from winning by permanently interrupting it.

Playtest target: standing still and repeatedly attacking should lose a fresh match; reacting to the warnings and dodging or moving away should make winning possible. Adjust timing before adding more mechanics.

## 6. Presentation

Use two visually distinct, original fighter portraits beside their health bars. A static portrait with an expressive face is sufficient. The figures in the arena can be drawn from simple shapes with matching colors.

Make idle, attack, windup, dodge, and hit states distinguishable through pose, color, outlines, or short effects. Full sprite animation is unnecessary.

Package any image assets with the game so they load when another person runs the repository. Temporary portrait placeholders are acceptable in Phase 1; the intended finished version has the actual portraits.

## 7. Acceptance criteria

The partner should report each item as complete, partial, or missing.

### P0 — Required playable game

1. The documented launch steps open the game, and the instructions show movement, attack, dodge, start, and restart controls.
2. Enter starts a match with both fighters at 100 health, the player's streak at zero, and next-hit damage at 10.
3. Both movement key pairs work, the player faces the opponent automatically, and arena boundaries contain both fighters.
4. J attacks within melee range. An out-of-range attack does no damage, and one attack activation cannot hit more than once.
5. Attack recovery prevents repeated key presses or a held key from bypassing the attack cooldown.
6. K dodges in the held direction, or away from the opponent if no direction is held. It cannot be used continuously, and the player cannot attack during it.
7. An enemy strike that resolves during the dodge window causes no health loss or streak reset. An in-range strike outside that window can hit.
8. The computer approaches and attacks repeatedly, with a visible windup and a recovery period. Moving out of range during its windup avoids the hit. Standing still and repeatedly attacking loses a fresh match; a player who avoids attacks can win.
9. Uninterrupted successful player hits deal 10, 12, 14, 16, 18, 20, then 20 damage. The display updates after each hit.
10. An enemy hit deals 25 damage and resets the player's streak and next-hit damage to zero and 10 respectively. A miss or successful dodge leaves the streak unchanged.
11. Zero health ends combat and shows the correct win/loss/draw result. Health never displays below zero, and attacks after the result cause no further damage.
12. R after game over starts a clean match with initial health, positions, streak, and cooldowns. No attack from the previous match carries over.

### P1 — Intended visual finish

13. Two distinct character portraits appear beside their corresponding health bars and match the visual direction in section 1.
14. Health, streak, next-hit damage, and dodge readiness remain legible during combat.
15. Attack windups, successful hits, dodges, and streak resets have distinguishable visual feedback.

### P2 — Optional polish

16. Short hit/dodge sounds and a brief high-streak visual accent improve feedback. If sound is included, provide a mute control. These features do not change the combat rules.

## 8. Priorities and cuts

Finish P0 before polishing art or adding sound. Within P0, prioritize a runnable match, movement and attacks, health and restart, then enemy telegraphing, dodge, and the momentum rule. All are required for the completed gameplay.

P1 is the intended final presentation. Portraits matter to the concept, but simple static art is sufficient. Do not spend the entire build period creating assets.

If time runs short, cut P2 first, then elaborate backgrounds, decorative effects, detailed portrait rendering, and animation. Preserve readable portraits and combat states where possible. Do not replace the real-time fight with a menu game or remove the streak/reset rule to make it easier to finish.

## 9. Phase 1 and handoff

The first commit contains SPEC.md and no game code.

During Phase 1, aim to leave a running arena with movement, one working attack, health, and a restart path. Add a basic opponent if time allows. Reserve the final 15–25 minutes for documentation and the final in-class commit.

Keep input, fighter state, combat rules, opponent behavior, and rendering easy to locate. The exact file layout is flexible. Put tuning values together so the next developer can adjust the game without searching through unrelated drawing code.

Before handoff:

- README.md explains how to run the game, the controls, what works, known problems, and the obvious next tasks.
- The prompt log records the AI prompts actually used, including design assistance where relevant.
- README.md reports progress using the acceptance-criterion numbers above.
- Commit all required source files and assets before leaving class.

Phase 2 should extend the inherited game, finish the missing P0 criteria, then address P1. Any remaining gaps should be documented against the same numbered list.
