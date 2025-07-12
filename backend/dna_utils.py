import hashlib
import json
import base64
from typing import Dict, Any

def generate_dna(prompt: str, temperature: float, top_p: float, model: str) -> str:
    """
    Generate a unique DNA string based on generation parameters.
    This creates a reproducible hash that can be used to recreate similar results.
    """
    # Create a deterministic hash from the parameters
    data = {
        "prompt": prompt,
        "temperature": temperature,
        "top_p": top_p,
        "model": model,
        "version": "1.0"  # For future compatibility
    }
    
    # Convert to JSON string with sorted keys for consistency
    json_str = json.dumps(data, sort_keys=True)
    
    # Create SHA-256 hash
    hash_object = hashlib.sha256(json_str.encode())
    hash_hex = hash_object.hexdigest()
    
    # Take first 64 characters to create DNA
    dna = hash_hex[:64]
    
    return dna

def decode_dna(dna: str) -> Dict[str, Any]:
    """
    Attempt to decode DNA back to parameters.
    Note: This is a demonstration - in practice, you'd need to store
    the parameter mapping somewhere to truly recreate exact conditions.
    """
    # For this demo, we'll return estimated parameters based on DNA patterns
    # In a real implementation, you'd store the parameter mapping in a database
    
    # Simple pattern matching based on DNA characteristics
    char_sum = sum(ord(c) for c in dna)
    
    # Estimate temperature based on character sum
    temp = 0.1 + (char_sum % 20) * 0.1  # Range: 0.1 to 2.0
    
    # Estimate top_p based on different pattern
    top_p = 0.1 + (char_sum % 9) * 0.1  # Range: 0.1 to 0.9
    
    # Estimate model based on DNA prefix
    model_map = {
        '0': 'dolphin-phi:latest',
        '1': 'llama2:latest', 
        '2': 'mistral:latest',
        '3': 'gpt-4'
    }
    model = model_map.get(dna[0], 'dolphin-phi:latest')
    
    return {
        "temperature": round(temp, 1),
        "top_p": round(top_p, 1),
        "model": model,
        "dna": dna,
        "note": "Parameters estimated from DNA pattern"
    }

def validate_dna(dna: str) -> bool:
    """
    Validate that a DNA string is properly formatted.
    """
    if not isinstance(dna, str):
        return False
    
    if len(dna) != 64:
        return False
    
    # Check if all characters are valid hexadecimal
    try:
        int(dna, 16)
        return True
    except ValueError:
        return False

def remix_dna(dna_a: str, dna_b: str, crossover_point: int = 32) -> str:
    """
    Create a new DNA by combining two existing DNAs.
    """
    if not validate_dna(dna_a) or not validate_dna(dna_b):
        raise ValueError("Invalid DNA format")
    
    if crossover_point < 1 or crossover_point >= 64:
        crossover_point = 32
    
    # Simple crossover: take first part of A and last part of B
    remixed = dna_a[:crossover_point] + dna_b[crossover_point:]
    
    return remixed

def mutate_dna(dna: str, mutation_rate: float = 0.1) -> str:
    """
    Apply random mutations to DNA string.
    """
    if not validate_dna(dna):
        raise ValueError("Invalid DNA format")
    
    import random
    
    dna_list = list(dna)
    hex_chars = '0123456789abcdef'
    
    for i in range(len(dna_list)):
        if random.random() < mutation_rate:
            dna_list[i] = random.choice(hex_chars)
    
    return ''.join(dna_list)

def generate_persona_dna(persona_name: str, traits: Dict[str, Any]) -> str:
    """
    Generate DNA for custom personas with specific traits.
    """
    data = {
        "persona": persona_name,
        "traits": traits,
        "type": "persona_dna",
        "version": "1.0"
    }
    
    json_str = json.dumps(data, sort_keys=True)
    hash_object = hashlib.sha256(json_str.encode())
    
    return hash_object.hexdigest()[:64]

def analyze_dna_compatibility(dna_a: str, dna_b: str) -> Dict[str, Any]:
    """
    Analyze how compatible two DNA strings are for remixing.
    """
    if not validate_dna(dna_a) or not validate_dna(dna_b):
        return {"error": "Invalid DNA format"}
    
    # Calculate Hamming distance (number of different characters)
    differences = sum(c1 != c2 for c1, c2 in zip(dna_a, dna_b))
    similarity = (64 - differences) / 64 * 100
    
    # Analyze patterns
    patterns_a = {
        'vowels': sum(1 for c in dna_a if c in 'aeiou'),
        'consonants': sum(1 for c in dna_a if c in 'bcdfghjklmnpqrstvwxyz'),
        'numbers': sum(1 for c in dna_a if c.isdigit())
    }
    
    patterns_b = {
        'vowels': sum(1 for c in dna_b if c in 'aeiou'),
        'consonants': sum(1 for c in dna_b if c in 'bcdfghjklmnpqrstvwxyz'),
        'numbers': sum(1 for c in dna_b if c.isdigit())
    }
    
    return {
        "similarity_percentage": round(similarity, 2),
        "differences": differences,
        "recommended_crossover": 32 if similarity > 50 else 16,
        "patterns_a": patterns_a,
        "patterns_b": patterns_b,
        "compatibility": "High" if similarity > 70 else "Medium" if similarity > 40 else "Low"
    }
