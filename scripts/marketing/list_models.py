import os
import google.generativeai as genai

os.environ["GOOGLE_API_KEY"] = "AIzaSyD865_d5XzvsNotFBFi0K9DpgQAi7FQ7HY"
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

print("Listing available models:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
