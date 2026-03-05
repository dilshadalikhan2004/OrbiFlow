import urllib.request
try:
    with urllib.request.urlopen('http://localhost:8000/api/v1/health', timeout=1) as f:
        print(f.read().decode('utf-8'))
except Exception as e:
    print('Error:', e)
