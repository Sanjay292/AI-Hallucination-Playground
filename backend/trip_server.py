from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import sqlite3
import uuid
from datetime import datetime
import edge_tts
import asyncio
import tempfile
import base64
import os
import hashlib

app = Flask(__name__)
CORS(app)

# Configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
DATABASE_PATH = "hallucination_playground.db"

# Open source - no limits, all features free!
DEFAULT_SETTINGS = {
    'daily_limit': -1,  # Unlimited
    'monthly_limit': -1,  # Unlimited
    'models': ['dolphin-phi:latest', 'llama2:latest', 'mistral:latest', 'all'],
    'features': ['voice_synthesis', 'dna_remix', 'batch_generation', 'collaboration']
}

# Simple DNA generation function (since dna_utils might not exist)
def generate_dna(prompt, temp, top_p, model):
    """Generate a unique DNA string based on generation parameters"""
    data_string = f"{prompt[:100]}-{temp}-{top_p}-{model}-{datetime.now().isoformat()}"
    hash_object = hashlib.sha256(data_string.encode())
    return hash_object.hexdigest()

def decode_dna(dna):
    """Decode DNA string (placeholder implementation)"""
    return {
        "prompt": "Decoded from DNA",
        "temp": 1.3,
        "top_p": 0.9,
        "model": "dolphin-phi:latest",
        "dna": dna
    }

# Database initialization
def init_db():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            username TEXT,
            daily_usage INTEGER DEFAULT 0,
            monthly_usage INTEGER DEFAULT 0,
            total_usage INTEGER DEFAULT 0,
            favorite_model TEXT DEFAULT 'dolphin-phi:latest',
            last_reset DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS generations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            prompt TEXT,
            output TEXT,
            dna TEXT,
            parameters TEXT,
            model_used TEXT,
            generation_time REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS community_prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            title TEXT NOT NULL,
            prompt TEXT NOT NULL,
            description TEXT,
            tags TEXT,
            likes INTEGER DEFAULT 0,
            downloads INTEGER DEFAULT 0,
            is_featured BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sponsors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            tier TEXT NOT NULL,
            logo_url TEXT,
            website_url TEXT,
            message TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usage_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            total_users INTEGER DEFAULT 0,
            total_generations INTEGER DEFAULT 0,
            models_used TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Add some sample community prompts
    cursor.execute("SELECT COUNT(*) FROM community_prompts")
    if cursor.fetchone()[0] == 0:
        sample_prompts = [
            ("Cosmic Dreams", "Digital dragons soaring through cyberpunk cityscapes made of flowing data streams", "A vivid journey through digital realms", "cosmic,dragons,cyberpunk", 45),
            ("Quantum Poetry", "Quantum cats phasing between parallel dimensions of pure mathematics", "Explore the intersection of quantum physics and feline grace", "quantum,cats,mathematics", 38),
            ("Neon Nature", "Neon forests growing in abandoned space stations, their leaves glowing with bioluminescence", "Nature reclaiming technology in spectacular fashion", "neon,forest,space", 52),
            ("Memory Rain", "Holographic butterflies dancing in virtual rain that tastes like memories", "A synesthetic experience of digital nostalgia", "holographic,butterflies,memories", 41),
            ("Crystal Symphony", "Crystalline mountains singing electronic melodies that reshape reality itself", "Mountains as living instruments of reality manipulation", "crystal,mountains,music", 33)
        ]
        cursor.executemany(
            "INSERT INTO community_prompts (title, prompt, description, tags, likes) VALUES (?, ?, ?, ?, ?)",
            sample_prompts
        )
    
    # Add sample sponsors
    cursor.execute("SELECT COUNT(*) FROM sponsors")
    if cursor.fetchone()[0] == 0:
        sample_sponsors = [
            ("Open AI Foundation", "platinum", "", "https://example.org", "Supporting open-source AI creativity"),
            ("Tech for Good", "gold", "", "https://techforgood.com", "Empowering creative AI applications"),
            ("Community Builder", "silver", "", "https://community.dev", "Building the future of AI collaboration")
        ]
        cursor.executemany(
            "INSERT INTO sponsors (name, tier, logo_url, website_url, message) VALUES (?, ?, ?, ?, ?)",
            sample_sponsors
        )
    
    conn.commit()
    conn.close()
    print("✅ Database initialized successfully")

def get_or_create_user(user_id):
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    user = cursor.fetchone()
    
    if not user:
        cursor.execute("""
            INSERT INTO users (user_id, daily_usage, monthly_usage, total_usage, last_reset)
            VALUES (?, 0, 0, 0, ?)
        """, (user_id, datetime.now().date()))
        conn.commit()
        
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        user = cursor.fetchone()
        print(f"✅ Created new user: {user_id}")
    
    conn.close()
    return user

# Voice generation function
def generate_voice_sync(text, lang_code="pt-BR"):
    """Synchronous wrapper for voice generation using edge-tts"""
    print(f"🔊 Generating voice for text: '{text[:50]}...' in {lang_code}")
    
    async def _generate():
        voice_map = {
            "pt-BR": "Microsoft Server Speech Text to Speech Voice (pt-BR, FranciscaNeural)",
            "pt-PT": "pt-PT-RaquelNeural", 
            "en-US": "en-US-AriaNeural",
            "es-ES": "es-ES-ElviraNeural",
            "fr-FR": "fr-FR-DeniseNeural"
        }
        
        voice = voice_map.get(lang_code, voice_map["pt-BR"])
        print(f"🎤 Using voice: {voice}")
        
        communicate = edge_tts.Communicate(text, voice)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
            await communicate.save(f.name)
            print(f"💾 Audio saved to: {f.name}")
            
            with open(f.name, "rb") as mp3:
                b64 = base64.b64encode(mp3.read()).decode()
            
            os.remove(f.name)
            print(f"✅ Voice generated successfully, size: {len(b64)} characters")
            return b64
    
    # Run async function in event loop
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(_generate())

# Routes
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "features": ["text_generation", "voice_synthesis", "dna_system", "community_sharing"],
        "open_source": True,
        "unlimited": True
    })

@app.route("/user/stats", methods=["GET"])
def get_user_stats():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        # Get or create user
        user = get_or_create_user(user_id)
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT daily_usage, monthly_usage, total_usage FROM users WHERE user_id = ?", (user_id,))
        user_data = cursor.fetchone()
        
        if user_data:
            daily_usage, monthly_usage, total_usage = user_data
        else:
            daily_usage, monthly_usage, total_usage = 0, 0, 0
        
        stats = {
            "daily_usage": daily_usage,
            "monthly_usage": monthly_usage,
            "total_usage": total_usage,
            "daily_limit": -1,  # Unlimited
            "monthly_limit": -1,  # Unlimited
            "available_models": DEFAULT_SETTINGS['models'],
            "features_enabled": DEFAULT_SETTINGS['features'],
            "is_open_source": True
        }
        
        conn.close()
        return jsonify(stats)
        
    except Exception as e:
        print(f"❌ Error in get_user_stats: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/history", methods=["GET"])
def get_history():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT prompt, output, dna, parameters, model_used, generation_time, created_at 
            FROM generations 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        """, (user_id,))
        
        history = []
        for row in cursor.fetchall():
            try:
                parameters = json.loads(row[3]) if row[3] else {}
            except:
                parameters = {"temp": 1.3, "top_p": 0.9, "model": "dolphin-phi:latest", "persona": ""}
                
            history.append({
                "prompt": row[0][:100] if row[0] else "",
                "output": row[1] if row[1] else "",
                "dna": row[2] if row[2] else "",
                "parameters": parameters,
                "model_used": row[4] if row[4] else "",
                "generation_time": row[5] if row[5] else 0,
                "timestamp": row[6] if row[6] else ""
            })
        
        conn.close()
        return jsonify({"history": history})
        
    except Exception as e:
        print(f"❌ Error in get_history: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/community/prompts", methods=["GET"])
def get_community_prompts():
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT title, prompt, description, tags, likes, downloads, is_featured, created_at 
            FROM community_prompts 
            ORDER BY is_featured DESC, likes DESC 
            LIMIT 20
        """)
        
        prompts = []
        for row in cursor.fetchall():
            prompts.append({
                "title": row[0],
                "prompt": row[1],
                "description": row[2],
                "tags": row[3].split(',') if row[3] else [],
                "likes": row[4],
                "downloads": row[5],
                "is_featured": bool(row[6]),
                "created_at": row[7]
            })
        
        conn.close()
        return jsonify({"prompts": prompts})
        
    except Exception as e:
        print(f"❌ Error in get_community_prompts: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/sponsors", methods=["GET"])
def get_sponsors():
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT name, tier, logo_url, website_url, message 
            FROM sponsors 
            WHERE is_active = TRUE 
            ORDER BY 
                CASE tier 
                    WHEN 'platinum' THEN 1 
                    WHEN 'gold' THEN 2 
                    WHEN 'silver' THEN 3 
                    WHEN 'bronze' THEN 4 
                    ELSE 5 
                END
        """)
        
        sponsors = []
        for row in cursor.fetchall():
            sponsors.append({
                "name": row[0],
                "tier": row[1],
                "logo_url": row[2],
                "website_url": row[3],
                "message": row[4]
            })
        
        conn.close()
        return jsonify({"sponsors": sponsors})
        
    except Exception as e:
        print(f"❌ Error in get_sponsors: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/recreate", methods=["POST"])
def recreate():
    try:
        data = request.json
        dna = data.get("dna", "")
        decoded = decode_dna(dna)
        return jsonify(decoded)
    except Exception as e:
        print(f"❌ Error in recreate: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/trip", methods=["POST"])
def trip():
    try:
        start_time = datetime.now()
        data = request.json
        user_id = data.get('user_id', str(uuid.uuid4()))
        
        print(f"🚀 Generation request from user: {user_id}")
        
        # Get or create user (no limits in open source!)
        user = get_or_create_user(user_id)
        
        # Prepare payload for Ollama
        payload = {
            "model": data.get("model", "dolphin-phi:latest"),
            "prompt": data.get("prompt", "Hello"),
            "system": data.get("persona", ""),
            "options": {
                "temperature": float(data.get("temp", 1.3)),
                "top_p": float(data.get("top_p", 0.95)),
                "max_tokens": 600
            },
            "stream": False
        }
        
        print(f"🤖 Calling Ollama with model: {payload['model']}")
        
        # Call Ollama
        try:
            r = requests.post(OLLAMA_URL, json=payload, timeout=60)
            if r.status_code != 200:
                return jsonify({"error": f"Ollama error: {r.status_code} - {r.text}"}), 500
            response_text = r.json().get("response", "No response from AI")
            print(f"✅ AI generation successful, length: {len(response_text)} characters")
        except requests.exceptions.ConnectionError:
            return jsonify({"error": "Cannot connect to Ollama. Make sure it's running with 'ollama serve'"}), 500
        except Exception as e:
            print(f"❌ Ollama request failed: {e}")
            return jsonify({"error": f"Ollama request failed: {str(e)}"}), 500
        
        # Generate DNA
        dna = generate_dna(
            data.get("prompt", ""), 
            float(data.get("temp", 1.3)),
            float(data.get("top_p", 0.95)), 
            data.get("model", "dolphin-phi:latest")
        )
        
        # Handle voice synthesis (now free for everyone!)
        voice_data = None
        if data.get("voice_enabled"):
            try:
                print("🔊 Voice synthesis requested...")
                voice_data = generate_voice_sync(response_text, data.get("lang", "pt-BR"))
                print("✅ Voice synthesis completed")
            except Exception as e:
                print(f"❌ Voice synthesis failed: {e}")
                # Don't fail the whole request if voice fails
        
        # Calculate generation time
        end_time = datetime.now()
        generation_time = (end_time - start_time).total_seconds()
        
        # Save to database
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        parameters = json.dumps({
            "temp": data.get("temp", 1.3),
            "top_p": data.get("top_p", 0.95),
            "model": data.get("model", "dolphin-phi:latest"),
            "persona": data.get("persona", "")
        })
        
        cursor.execute("""
            INSERT INTO generations (user_id, prompt, output, dna, parameters, model_used, generation_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, data.get("prompt", ""), response_text, dna, parameters, 
              data.get("model", "dolphin-phi:latest"), generation_time))
        
        # Update usage
        cursor.execute("""
            UPDATE users 
            SET daily_usage = daily_usage + 1, monthly_usage = monthly_usage + 1, total_usage = total_usage + 1
            WHERE user_id = ?
        """, (user_id,))
        
        conn.commit()
        conn.close()
        
        response = {
            "output": response_text,
            "dna": dna,
            "user_id": user_id,
            "generation_time": generation_time
        }
        
        if voice_data:
            response["voice"] = voice_data
        
        print(f"✅ Generation completed successfully for user: {user_id}")
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Error in trip: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/voice", methods=["POST"])
def voice():
    try:
        data = request.json
        user_id = data.get('user_id')
        
        print(f"🔊 Voice generation request from user: {user_id}")
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        text = data.get("text", "")
        lang_code = data.get("lang", "pt-BR")
        
        if not text:
            return jsonify({"error": "Text is required"}), 400
        
        if len(text) > 1000:
            return jsonify({"error": "Text too long (max 1000 characters)"}), 400
        
        # Generate voice (now free for everyone!)
        voice_data = generate_voice_sync(text, lang_code)
        
        print(f"✅ Voice generation completed for user: {user_id}")
        return jsonify({"mp3": voice_data})
        
    except Exception as e:
        print(f"❌ Voice generation error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/share/prompt", methods=["POST"])
def share_prompt():
    try:
        data = request.json
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO community_prompts (user_id, title, prompt, description, tags)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, data.get('title', ''), data.get('prompt', ''), 
              data.get('description', ''), data.get('tags', '')))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Prompt shared by user: {user_id}")
        return jsonify({"message": "Prompt shared successfully!"})
        
    except Exception as e:
        print(f"❌ Error in share_prompt: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/analytics", methods=["GET"])
def get_analytics():
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get total users
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]
        
        # Get total generations
        cursor.execute("SELECT COUNT(*) FROM generations")
        total_generations = cursor.fetchone()[0]
        
        # Get popular models
        cursor.execute("""
            SELECT model_used, COUNT(*) as count 
            FROM generations 
            WHERE model_used IS NOT NULL 
            GROUP BY model_used 
            ORDER BY count DESC 
            LIMIT 5
        """)
        popular_models = [{"model": row[0], "count": row[1]} for row in cursor.fetchall()]
        
        # Get recent activity (last 7 days)
        cursor.execute("""
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM generations 
            WHERE created_at >= datetime('now', '-7 days') 
            GROUP BY DATE(created_at) 
            ORDER BY date DESC
        """)
        recent_activity = [{"date": row[0], "count": row[1]} for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            "total_users": total_users,
            "total_generations": total_generations,
            "popular_models": popular_models,
            "recent_activity": recent_activity,
            "open_source": True
        })
        
    except Exception as e:
        print(f"❌ Error in get_analytics: {e}")
        return jsonify({"error": str(e)}), 500

# Initialize database
init_db()

if __name__ == "__main__":
    print("🧠 AI Hallucination Playground - Open Source Backend Starting...")
    print("📡 Server: http://localhost:5000")
    print("🤖 Ollama: http://localhost:11434")
    print("💾 Database: hallucination_playground.db")
    print("🔊 Voice: edge-tts enabled (FREE)")
    print("🎉 All features unlocked for everyone!")
    print("💝 Support us: GitHub Sponsors, Open Collective")
    print("✨ Ready for unlimited hallucinations!")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
