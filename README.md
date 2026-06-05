# Touhou XP Music Player

A nostalgia-fueled Windows XP Luna desktop recreation featuring a retro media player with a 200+ song library of music from the *Touhou Project* video game saga. The media player includes real-time digital audio filters (DSP), dynamic spectrum visualizers, interactive desktop pets (Shimejis), and classic Windows XP apps like Minesweeper and MS Paint.

## Features

1. **Retro Windows XP Desktop**: A pixel-perfect recreation of the classic Windows XP Luna interface, including draggable/maximizable windows, taskbar shortcuts, start menu, tray clock, and retro system dialog sound effects.
2. **Touhou Media Player**:
   - Play, pause, stop, track skipping, shuffle, repeat, and favorites list.
   - Dynamic HTML5 Canvas spectrum analyzer and CRT-style oscilloscope visualizers.
   - A curated database of 208 tracks with titles, release years, and games.
3. **Real-time Digital Audio Processing (DSP)**:
   - **Tono y Velocidad (Pitch/Tempo)**: Modify audio playback rate.
   - **Lowpass Filter**: Muffle treble frequencies for an underwater effect.
   - **Highpass Filter**: Strip bass frequencies for a vintage AM radio tone.
   - **Echo/Delay**: Create looping feedback echoes.
   - **Distortion**: Add soft analog clipping and saturation.
   - **Reverb**: Synthesize a cathedral impulse response to add ambient space.
4. **Interactive Shimeji Desktop Pet**: Spawns Reimu Hakurei on the desktop.
   - High-resolution vector-rendered frames cropped via union bounding boxes to ensure smooth, jitter-free animation cycles.
   - Gravity, acceleration, ceiling bounces, and window platform landing collision physics.
   - Pointer dragging, velocity fling physics, and dizzy spin state.
   - Toggles via Start menu or desktop shortcuts (with support for upcoming pet slots like Marisa and Cirno).
5. **Minesweeper App**: Full 9x9 layout with 10 mines, tile cascades, right-click flags, digital timers, and classic sound cues.
6. **MS Paint App**: Retro canvas editor supporting pencil, brush, shapes, eraser, eyedropper, a recursive flood-fill bucket, undo stack (`Ctrl+Z`), and image saving.
7. **Bilingual Localization**: Seamlessly switch between English (EN) and Spanish (ES) in real-time across all application elements.

## Running Locally

To run the project locally, start a static web server in the root directory:

```bash
# Using Node's http-server:
npx http-server -p 8080

# Or using Python:
python -m http.server 8080
```

Then open `http://localhost:8080` in your web browser.

## Credits & Attributions

- **Reimu Character Sprites**: Ripped and compiled by [DarkOverord](https://www.spriters-resource.com/profile/darkoverord/) (available via [The Spriters Resource](https://www.spriters-resource.com/)).
- **Touhou Project**: Music, characters, and intellectual property belong to **Team Shanghai Alice / ZUN**.
- **Audio Resources**: Music tracks are compiled from community-hosted, CORS-enabled Archive.org collections.
- **Sound Effects**: Windows XP start-up, error, and shutdown sounds are trademarks of Microsoft Corporation.

## License

This project is open-source and available under the MIT License.
