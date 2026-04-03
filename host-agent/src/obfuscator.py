import base64

def obfuscate(text: str, key: str = "remotemcu_secret_key") -> str:
    """
    Simple XOR obfuscation + Base64 encoding.
    This is not cryptographically secure, but it prevents 
    accidental viewing of plain-text credentials in the agent.
    """
    if not text:
        return ""
    
    # Simple XOR with a repeating key
    xor_result = "".join(
        chr(ord(c) ^ ord(key[i % len(key)]))
        for i, c in enumerate(text)
    )
    # Return as base64 string
    return base64.b64encode(xor_result.encode()).decode()

def deobfuscate(encoded_text: str, key: str = "remotemcu_secret_key") -> str:
    """Decodes and de-XORs the obfuscated string."""
    if not encoded_text:
        return ""
    
    try:
        # Decode base64
        xor_text = base64.b64decode(encoded_text.encode()).decode()
        # De-XOR
        result = "".join(
            chr(ord(c) ^ ord(key[i % len(key)]))
            for i, c in enumerate(xor_text)
        )
        return result
    except Exception:
        return ""

if __name__ == "__main__":
    # Utility for the developer to generate obfuscated strings
    import sys
    if len(sys.argv) > 1:
        val = sys.argv[1]
        print(f"Obfuscated: {obfuscate(val)}")
