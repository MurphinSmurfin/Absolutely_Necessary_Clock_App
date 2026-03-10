## ⏰ Absolutely Necessary Clock App

Because obviously the one thing missing from your life was a dramatic, glowing, multi-person clock-in tracker.

This app exists to answer the timeless question:

> "Did we actually clock in… or did we just talk about clocking in?"

### What this thing does

- Tracks daily clock-ins for three very real, very busy humans:
  - Murph
  - Desmond
  - Eric
- Auto–clock-ins when you open the secret Clock In page (so you don’t forget).
- Lets you **override** today’s clock-in time… but only if you tap Clock In 5 times like you really, truly mean it.
- Calculates when you’ve hit:
  - Half day (4.5 hours, but never before 1:00 PM)
  - Full day (9.5 hours, but never before 6:00 PM)
- Supports different time formats and time zones, because time is fake but payroll is not.
- Has unnecessarily cool animated glow presets, because vibes are billable.

### Pages

- **Home** – Big cozy clock, current date, glowing nonsense. The normal, respectable part of the app.
- **About** – Why this exists, probably some questionable life choices.
- **Settings** – Time format, timezone, glow preset. Everything you need to make the clock feel important.
- **Clock In (secret page)** –
  - Hidden behind a special Home button sequence.
  - Shows today’s clock-in, expected half day, expected full day.
  - One tab per person so nobody “accidentally” steals someone else’s shift.

### Secret entrance 🔐

To open the **Clock In** page:

1. Tap **Home** three times (quickly) from anywhere.
2. Boom: Clock In panel appears.
3. Panic slightly at how late it is.

To leave Clock In and go back home:

- Tap **Home** once while already on Clock In.

### Safety against mispress chaos

- When you open Clock In, **no person is selected** by default.
- Nothing is auto-clocked-in until you explicitly tap a person.
- If you mash Clock In too enthusiastically:
  - You’ll first get a red “are you sure you want to override?” warning.
  - Only after 5 quick taps do you get access to the custom time picker.

### Tech-y bits (for future you)

- Built with **Expo** + **React Native**.
- Uses **expo-router** for navigation.
- Animation magic by `react-native-animated-glow` (plus a little patch in `patches/`).
- Stores clock-in data locally using AsyncStorage.

### Running the app

Install stuff:

```bash
npm install
```

Start the dev server:

```bash
npx expo start
```

Then open it in your emulator, simulator, or on-device via Expo Go. Stare at the clock. Question your life choices. Clock in anyway.

### Why “Absolutely Necessary”?

Because if anyone ever questions why you spent this much effort on a clock, you can look them straight in the eye and say:

> "It’s an **absolutely necessary** operational tool. Also it glows."

Which is, frankly, undeniable.
