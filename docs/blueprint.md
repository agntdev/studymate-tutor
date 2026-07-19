# StudyMate Tutor Bot — Bot specification

**Archetype:** education

**Voice:** professional and encouraging — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot for teachers and tutors that generates step-by-step solutions, teaching notes, quizzes, and study strategies. Supports text/image inputs, conversational follow-ups, and persistent note-taking for educational material creation.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- teachers
- tutors

## Success criteria

- Teachers can generate classroom-ready solutions and materials in under 10 seconds per question

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Show initial help and core commands
- **/quiz** (command, actor: user, command: /quiz) — Initiate quiz creation flow
  - inputs: topic, difficulty, question count
  - outputs: configured quiz with model answers
- **/note** (command, actor: user, command: /note) — Manage notes (add/list/delete)
  - inputs: add|list|delete, topic, note content
  - outputs: note confirmation, note list, deletion confirmation
- **Make quiz** (button, actor: user, callback: quiz:create) — Generate quiz from current question/topic
  - inputs: question count, difficulty
  - outputs: quiz preview
- **Alternative method** (button, actor: user, callback: solution:alternate) — Request alternative solution approach
  - inputs: none
  - outputs: new solution method

## Flows

### Question solving
_Trigger:_ user sends text/image

1. Receive question input
2. Generate step-by-step solution
3. Add teaching notes and misconceptions
4. Present quick-action buttons

_Data touched:_ user context, notes

### Quiz creation
_Trigger:_ /quiz or quiz button

1. Request topic/difficulty
2. Generate questions
3. Deliver quiz in sequence
4. Provide model answers on demand

_Data touched:_ quiz config, user context

### Note management
_Trigger:_ /note command

1. Parse note action
2. Store/retrieve notes
3. Confirm changes

_Data touched:_ persistent notes

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User account** _(retention: persistent)_ — Telegram ID and preferences
  - fields: telegram_id, default_difficulty, retention_policy
- **Study note** _(retention: persistent)_ — Teacher-created notes by topic
  - fields: topic, content, timestamp
- **Q&A history** _(retention: session)_ — Recent interactions for context
  - fields: question, solution, timestamp

## Integrations

- **Telegram** (required) — Bot API messaging and inline keyboards
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Configure default difficulty levels
- Set note retention policies
- Manage quiz defaults (question count)

## Notifications

- Immediate chat replies for all outputs
- Contextual quick-reply buttons

## Permissions & privacy

- All data private to creating teacher
- No third-party sharing
- Image analysis confined to question context

## Edge cases

- OCR errors in image inputs
- Ambiguous question level inference
- Large note content handling
- Quiz generation for niche topics

## Required tests

- End-to-end quiz generation with 3 question variants
- Image-to-solution flow with OCR fallback
- Note persistence across sessions

## Assumptions

- Teachers prefer mid-level explanations by default
- Quiz defaults optimized for classroom drills
- OCR processing handles common question formats
