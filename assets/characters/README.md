# Character assets

Mira uses the Rogue and Theo uses the Knight from Kay Lousberg’s KayKit Adventurers Character Pack 1.0, licensed CC0. Source: https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 . The original license is included as KayKit-LICENSE.txt.

The original official GLBs were downloaded on 2026-10-20. `tools/trim-character-assets.py` retains ten relevant animation clips and losslessly compacts unused accessors and buffers. Geometry, skinning, materials, textures, and the retained animation data are preserved. The game clones the skeleton per character, normalizes scale, rotates it to the game’s forward direction, and hides unused weapon accessories. The models are loaded lazily with a procedural fallback, so a failed model download cannot stop the game.
