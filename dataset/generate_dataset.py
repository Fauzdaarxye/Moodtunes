"""
generate_dataset.py
Generates a synthetic Spotify-style dataset with mood labels.
Run this once to create spotify_mood_dataset.csv
"""
import pandas as pd
import numpy as np

np.random.seed(42)
N = 1000

SONGS = {
    "Happy": [
        ("Happy", "Pharrell Williams"), ("Can't Stop the Feeling!", "Justin Timberlake"),
        ("Uptown Funk", "Mark Ronson ft. Bruno Mars"), ("Good as Hell", "Lizzo"),
        ("Shake It Off", "Taylor Swift"), ("Dancing Queen", "ABBA"),
        ("I Gotta Feeling", "Black Eyed Peas"), ("Levitating", "Dua Lipa"),
        ("Blinding Lights", "The Weeknd"), ("Dynamite", "BTS"),
        ("Watermelon Sugar", "Harry Styles"), ("Peaches", "Justin Bieber"),
        ("Leave the Door Open", "Silk Sonic"), ("STAY", "The Kid LAROI & Justin Bieber"),
        ("Butter", "BTS"), ("Good 4 U", "Olivia Rodrigo"),
        ("Montero", "Lil Nas X"), ("Heat Waves", "Glass Animals"),
        ("As It Was", "Harry Styles"), ("About Damn Time", "Lizzo"),
    ],
    "Sad": [
        ("Someone Like You", "Adele"), ("The Night We Met", "Lord Huron"),
        ("Skinny Love", "Bon Iver"), ("Fix You", "Coldplay"),
        ("Let Her Go", "Passenger"), ("When the Party's Over", "Billie Eilish"),
        ("Hurt", "Johnny Cash"), ("The Night Will Always Win", "Manchester Orchestra"),
        ("Liability", "Lorde"), ("Slow Dancing in the Dark", "Joji"),
        ("Cry Me a River", "Justin Timberlake"), ("Strange", "Celeste"),
        ("Driver's License", "Olivia Rodrigo"), ("Lonely", "Akon"),
        ("Skinny Love", "Birdy"), ("Too Good at Goodbyes", "Sam Smith"),
        ("Stay With Me", "Sam Smith"), ("Fallingforyou", "The 1975"),
        ("Breathin", "Ariana Grande"), ("i hate u, i love u", "gnash"),
    ],
    "Energetic": [
        ("Thunderstruck", "AC/DC"), ("Eye of the Tiger", "Survivor"),
        ("Lose Yourself", "Eminem"), ("Run the World", "Beyoncé"),
        ("Power", "Kanye West"), ("Stronger", "Kanye West"),
        ("Till I Collapse", "Eminem"), ("Jump Around", "House of Pain"),
        ("Pump It", "Black Eyed Peas"), ("Turn Down for What", "DJ Snake"),
        ("Sicko Mode", "Travis Scott"), ("God's Plan", "Drake"),
        ("HUMBLE.", "Kendrick Lamar"), ("Mo Bamba", "Sheck Wes"),
        ("Rockstar", "Post Malone"), ("Mask Off", "Future"),
        ("Bad Guy", "Billie Eilish"), ("7 rings", "Ariana Grande"),
        ("Old Town Road", "Lil Nas X"), ("Banger", "Stormzy"),
    ],
    "Calm": [
        ("Weightless", "Marconi Union"), ("Clair de Lune", "Debussy"),
        ("Gymnopédie No.1", "Erik Satie"), ("Ocean Eyes", "Billie Eilish"),
        ("Yellow", "Coldplay"), ("The Scientist", "Coldplay"),
        ("Breathe", "Pink Floyd"), ("Holocene", "Bon Iver"),
        ("Skinny Love", "Bon Iver"), ("Bloom", "The Paper Kites"),
        ("All I Want", "Kodaline"), ("A Thousand Years", "Christina Perri"),
        ("Sunset Lover", "Petit Biscuit"), ("Nightcall", "Kavinsky"),
        ("Comptine d'un autre été", "Yann Tiersen"), ("River Flows in You", "Yiruma"),
        ("Experience", "Ludovico Einaudi"), ("Fly Me to the Moon", "Frank Sinatra"),
        ("La Vie en Rose", "Édith Piaf"), ("The Night Cafe", "Lofi Girl"),
    ],
}

MOOD_PARAMS = {
    "Happy":    dict(valence=(0.7, 0.95), energy=(0.65, 0.95), danceability=(0.65, 0.9),
                     tempo=(110, 150), acousticness=(0.02, 0.25), loudness=(-6, -2)),
    "Sad":      dict(valence=(0.05, 0.35), energy=(0.1, 0.45), danceability=(0.2, 0.55),
                     tempo=(60, 100), acousticness=(0.3, 0.85), loudness=(-18, -8)),
    "Energetic":dict(valence=(0.45, 0.8), energy=(0.8, 1.0), danceability=(0.7, 0.95),
                     tempo=(128, 180), acousticness=(0.0, 0.1), loudness=(-4, 0)),
    "Calm":     dict(valence=(0.3, 0.65), energy=(0.05, 0.35), danceability=(0.2, 0.55),
                     tempo=(50, 90), acousticness=(0.5, 0.98), loudness=(-25, -10)),
}

rows = []
moods = ["Happy", "Sad", "Energetic", "Calm"]
per_mood = N // 4

for mood in moods:
    p = MOOD_PARAMS[mood]
    song_pool = SONGS[mood]
    for i in range(per_mood):
        song, artist = song_pool[i % len(song_pool)]
        row = {
            "track_name": song,
            "artists": artist,
            "valence": np.clip(np.random.normal(np.mean(p["valence"]), 0.06), 0, 1),
            "energy": np.clip(np.random.normal(np.mean(p["energy"]), 0.07), 0, 1),
            "danceability": np.clip(np.random.normal(np.mean(p["danceability"]), 0.07), 0, 1),
            "tempo": np.clip(np.random.normal(np.mean(p["tempo"]), 8), 40, 200),
            "acousticness": np.clip(np.random.normal(np.mean(p["acousticness"]), 0.08), 0, 1),
            "loudness": np.clip(np.random.normal(np.mean(p["loudness"]), 2), -30, 0),
            "mood": mood,
        }
        rows.append(row)

df = pd.DataFrame(rows)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)
df.to_csv("spotify_mood_dataset.csv", index=False)
print(f"✅ Dataset saved: {len(df)} rows | Mood distribution:")
print(df["mood"].value_counts())
