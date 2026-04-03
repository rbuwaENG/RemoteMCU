from obfuscator import deobfuscate

# These are obfuscated project-wide settings to make the agent "Zero-Config"
# for the end-user. They are not intended for manual editing.

# remotemcu-bfb84
_P = "AAAAAAAAAAAAchEDAUpR"
# AIzaSyAwME2NaM71jmHgcjCGkeG6cj3s37YpBtU
_A = "MywXDiccLBQ4GkErAj9SRTUGLR4RDy4oHwAqVRY1QBZQRTwEHR8w"
# wss://65a47c2bf96f45ab949dfa9d8ecd5f9d.s1.eu.hivemq.cloud:8884/mqtt
_M = "BRYeVVtKW1YUa0QGURADTWkNUUwTB1RbTQELAkw7SwAAFlASZg9LCkNLCBpaDQQVEDICSwAeCgE7UV1BSlFCAgURGQ=="

# Deobfuscated values for internal use
FIREBASE_PROJECT_ID = deobfuscate(_P)
FIREBASE_API_KEY = deobfuscate(_A)
MQTT_BROKER_URL = deobfuscate(_M)

# Common MQTT credentials for this platform
# (If these change, update these obfuscated strings)
MQTT_USERNAME = deobfuscate("AAAAAAAAAAAA") # placeholder
MQTT_PASSWORD = deobfuscate("AAAAAAAAAAAA") # placeholder
