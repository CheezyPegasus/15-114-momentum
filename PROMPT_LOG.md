# Prompt log

This records the user requests that shaped the game and the implementation. Terminal setup and unrelated messages are omitted. Quoted excerpts are verbatim; commentary below them describes the resulting work rather than inventing additional user prompts.

## Design

### Opening request — excerpt, assignment brief omitted

> I need to do this for 15-114, I have to prompt a game someone else have to vibe code
>
> and the only thing on my mind is street fighters, but the females are very attractive and the males are built asf, some are boji 薄肌, and their facial features are hair are literally LADS 爱与深空
>
> design your game (**without** generating code) and write \`SPEC.md\`. Come to class with it ready to commit.
>
> I don't know, I don't even game due to family, like this is pushing my boundaries of knowledge

The user supplied the course assignment, including the three-hour scope, SPEC-only first commit, acceptance criteria, priorities, handoff documents, and the instruction that creative decisions belong to the student. The AI recommended reducing the scope and asked the user to choose gameplay and presentation.

### User's gameplay and presentation answers

> Which activity sounds most enjoyable during a fight?
> Move around, dodge, and land hits in real time
>
> How would you want the characters represented within this small project?
> Expressive character portraits beside simple fighting figures

### User's distinctive-rule answer

> Which rule would make you want to play another round?
> Risk and reward: consecutive hits increase your damage, but getting hit loses the bonus

The answer was repeated with the same choice. The AI drafted SPEC.md around these choices and supplied editable defaults for controls, damage, opponent behavior, timing, the working title, and priorities. No game code was created during that step.

## Phase 1 build — 2026-10-28

### User request

> ok now let's get to building

The AI used the current SPEC.md and built a Phase 1 foundation in plain JavaScript, HTML, and CSS. It implemented movement, attack recovery/range, basic enemy AI and telegraphing, momentum damage, health, KO/draw, restart, UI, and temporary original SVG portraits. It added engine tests and handoff documentation. Dodge and final portrait polish were left as explicit Phase 2 tasks.

This source package was created separately from the student's GitHub checkout. Its existence does not mean it has been committed or pushed to GitHub.

## Phase 2

## Avatar and game-screen revisions — 2026-10-28

User feedback, verbatim:

> bro, two things: first of all, the characters are the exact same garbage slop as before; second, the UI/UX website design is trash

> this is not what I wanted; I want the same 1:1 figure and actual avatars

> yes, like this; how update it for both characters

> stop working immediately after you finish and give me something I can push onto Git instantly

The assistant replaced the primitive in-arena drawing with two matching eight-pose character sheets and a shared sprite renderer. It rebuilt the page as a full-screen fight, added the spec's dodge mechanic and readiness indicator, body spacing, short impact pauses, sound with mute, pause/resume, and fullscreen controls. The animation sheets and background were generated using the exact prompts recorded in ART_DIRECTION.md. The engine has 16 passing tests. Browser QA confirmed both avatars render, movement and punch input work, health and streak change on a hit, and dodge shows a cooldown.

The source download excludes Git history and hosting identity, so it can be copied into the student's existing repository after the original SPEC-only commit. Downloading this package does not itself push it to GitHub.

### Partner continuation

Append the actual prompts you use and a short account of the changes you accept, reject, or adjust. Do not mark acceptance criteria complete until they have been checked.
